package controllers

import javax.inject.Inject

import models.rest.RestResponse
import org.apache.commons.lang3.StringUtils
import org.joda.time.DateTime
import org.joda.time.format.DateTimeFormat
import play.api.libs.json._
import play.api.libs.ws.{WSAuthScheme, WSClient, WSRequest}
import play.api.mvc.{Action, Controller}

import scala.concurrent.ExecutionContext.Implicits.global

class Repository @Inject()(ws: WSClient) extends Controller with Logging {

  lazy val githubUser = play.Play.application().configuration().getString("github.user")

  lazy val githubPassword = play.Play.application().configuration().getString("github.password")

  val dateFormat = DateTimeFormat.forPattern("yyyy-MM-dd")

  def authenticateRequest(request: WSRequest) = {
    if (StringUtils.isNotBlank(githubUser) && StringUtils.isNotBlank(githubPassword)) {
      request.withAuth(githubUser, githubPassword, WSAuthScheme.BASIC)
    } else {
      request
    }
  }

  def searchRepositories(searchKey: String) = Action.async {
    implicit request =>
      val request: WSRequest = authenticateRequest(ws.url("https://api.github.com/search/repositories")
        .withQueryString("q" -> searchKey, "per_page" -> "10"))
      request.get().map { response =>
        Ok(Json.toJson(RestResponse.success[JsValue](Some(response.json))))
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
        val maxDateOption = latestDate(rawCommitTimeLineMap.keys.toList)
        val commitTimeLineMap = maxDateOption.map { maxDateRaw =>
          val endDate = DateTime.parse(maxDateRaw, dateFormat)
          (0 until 29).map(endDate.minusDays).map { date =>
            val dateString = dateFormat.print(date)
            val commitCount = rawCommitTimeLineMap.getOrElse(dateString, 0)
            Json.obj(dateString -> commitCount)
          }.reverse.toList
        }.getOrElse(List.empty[JsObject])
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
        ))))
  }

  def latestDate(dates: List[String]): Option[String] = {
    dates match {
      case Nil => None
      case List(x: String) => Some(x)
      case x :: y :: rest => latestDate((if (x > y) x else y) :: rest)
    }
  }
}
