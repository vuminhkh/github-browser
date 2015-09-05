# github-browser

Simple project to test Github Rest API.

What can you do with this web app:
- Search for project
- See project's committer, their contribution part for the last 100 commits
- See project's activity timeline for the most last 100 commits

To run the project:
- Install Java 8
- Launch at the root of the project

```sh
$ ./activator run
```

- If after some queries, the web app do not work anymore it's due to Github quota for anonymous request, you should set your github account in conf/application.conf for bigger quota. See [here](https://developer.github.com/v3/#rate-limiting) for more details about github rate limiting 