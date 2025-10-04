display the history of the newsletter for our users


- only showcase SENT newsletter
- side bar of previous newsletters
    - Showcase ### of recent newsletters
    - have ability to scroll to next pages
    - paginated newsletters (cursor vs page), 
- showcase the newsletter with the HTML contents
- /newsletters/<issue_id>



/api/trpc/newsletters?page=1&resultsPerPage=10&orderBy=DESC

/api/trpc/newsletters?numResults=10

TTL:12hours AND we clear cache at 5AM as part of sending newsletter (set TTL 12hours)


Methods
issueRepo:
getRecentIssueName(numResults:number = 10); //Extensible to add other filters
getIssueById(issueId:number);

issueService:
getIssueSummaries(numResults:number = 10); //Extensible to add other filters
    - input validation (page number is valid, range is valid, offset valid, max numResultsPerPage etc)
    - check cache first
    - reutnr
getIssueById(issueId:number)
    - input validation (page number is valid, range is valid, offset valid, max numResultsPerPage etc)
    - check cache first
    - reutnr

issueRepo:
getIssueSummaries(GetNewsletterRequest) ->GetIssueSummariesResponse
getIssueById(issueId:number) -> Issue
GetNewsletterRequest
- subjectId
- numResults
- page
- text
- order
- etc

GetIssueSummariesResponse:
- IssueSummary[]

IssueSummary
- issueId
- issueTitle


FrontEnd
- PAGE /newsletter/<issue_id>
- IssueSideBar component
    - displays list of ### recent newsletters
    - api.getIssueSummaries.useQuery()

- IssueDisplay({issue_id})
    - defaults to most recent issue if issue_id not provided
    