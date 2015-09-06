package controllers

import java.util.regex.Pattern
import javax.inject.Inject

import models.rest.RestResponse
import org.apache.commons.lang3.StringUtils
import play.api.libs.json._
import play.api.libs.ws.{WSAuthScheme, WSClient, WSRequest}
import play.api.mvc.{Action, Controller}

import scala.concurrent.ExecutionContext.Implicits.global

class Repository @Inject()(ws: WSClient) extends Controller with Logging {

  lazy val githubUser = play.Play.application().configuration().getString("github.user")

  lazy val githubPassword = play.Play.application().configuration().getString("github.password")

  val linkPattern = Pattern.compile("^<http[^>]+[&?]page=([^>]+)[^>]*>; rel=\"(\\w+)\"$")

  def authenticateRequest(request: WSRequest) = {
    if (StringUtils.isNotBlank(githubUser) && StringUtils.isNotBlank(githubPassword)) {
      request.withAuth(githubUser, githubPassword, WSAuthScheme.BASIC)
    } else {
      request
    }
  }

  def getPageFromLink(linkOpt: Option[String]) = {
    linkOpt.map { link =>
      link.split(",").flatMap { linkEntry =>
        val matcher = linkPattern.matcher(linkEntry.trim)
        if (matcher.matches()) {
          Some(matcher.group(2).trim, matcher.group(1).trim)
        } else {
          None
        }
      }.toMap
    }.getOrElse(Map.empty)
  }

  def searchRepositories(searchKey: String, page: Option[String]) = Action.async {
    implicit request =>
      var request: WSRequest = authenticateRequest(ws.url("https://api.github.com/search/repositories"))
      if (page.isDefined) {
        request = request.withQueryString("q" -> searchKey, "per_page" -> "10", "page" -> page.get)
      } else {
        request = request.withQueryString("q" -> searchKey, "per_page" -> "10")
      }
      request.get().map { response =>
        val links = getPageFromLink(response.header("link"))
        val searchResponse = Json.obj(
          "pages" -> Json.obj(
            "next" -> links.get("next"),
            "last" -> links.get("last"),
            "prev" -> links.get("prev"),
            "first" -> links.get("first")
          ), "repositories" -> response.json)
        Ok(Json.toJson(RestResponse.success[JsValue](Some(searchResponse))))
      }
  }

  def getRepository(owner: String, repository: String) = Action.async {
    implicit request =>
      val repositoryRequest: WSRequest = authenticateRequest(ws.url("https://api.github.com/repos/" + owner + "/" + repository))
      val repositoryFuture = repositoryRequest.get().map(_.json)
      val collaboratorRequest: WSRequest = authenticateRequest(ws.url("https://api.github.com/repos/" + owner + "/" + repository + "/contributors"))
      val collaboratorFuture = collaboratorRequest.get().map(_.json)
      val commitsRequest: WSRequest = authenticateRequest(ws.url("https://api.github.com/repos/" + owner + "/" + repository + "/commits"))
        .withQueryString("per_page" -> "100")
      val commitContributionFuture = commitsRequest.get().map { response =>
        val commits = response.json.as[JsArray].value
        val commitContributionMap = commits.foldLeft(Map[String, JsNumber]()) { (counterMap, commit) =>
          val maybeAuthor = (commit \ "author" \ "login").toOption
          if (maybeAuthor.isDefined) {
            val author = maybeAuthor.get.as[JsString].value
            counterMap + (author -> JsNumber(counterMap.getOrElse(author, JsNumber(0)).value + 1))
          } else {
            counterMap
          }
        }
        val commitContributionsJson = Json.toJson(commitContributionMap)
        val rawCommitTimeLineMap = commits.foldLeft(Map[String, Int]()) { (counterMap, commit) =>
          val maybeDate = (commit \ "commit" \ "author" \ "date").toOption
          if (maybeDate.isDefined) {
            val authorTimestamp = maybeDate.get.as[JsString].value
            val indexOfTime = authorTimestamp.indexOf('T')
            val authorDate = authorTimestamp.substring(0, if (indexOfTime >= 0) indexOfTime else authorTimestamp.length)
            counterMap + (authorDate -> (counterMap.getOrElse(authorDate, 0) + 1))
          } else {
            counterMap
          }
        }
        val commitTimeLineMap = rawCommitTimeLineMap.keys.toList.sorted.map { date =>
          Json.obj(date -> rawCommitTimeLineMap(date))
        }
        val commitTimeLineJson = Json.toJson(commitTimeLineMap)
        Json.obj("contributors" -> commitContributionsJson, "timeline" -> commitTimeLineJson)
      }
      for {repository <- repositoryFuture
           collaborators <- collaboratorFuture
           contributions <- commitContributionFuture
      } yield Ok(Json.toJson(RestResponse.success[JsObject](
        Some(
          Json.obj(
            "repository" -> repository,
            "collaborators" -> collaborators,
            "contributions" -> contributions
          )
        )
      )))
  }
}
