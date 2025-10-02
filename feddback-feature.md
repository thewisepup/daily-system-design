Who is able to submit feedback?


How often can a user submit feedback?


What data should we track per feedback?




Short term, we allow unlimited feedback.


/feedback?token=<TOKEN>


POST /api/feedback






Requirements
- Allow users to submit newsletter feedback
    - track which user submitted feedback
    - track which newsletter issue
    - track subject id as well (this can be derived from newsletter issue id)
    - extensible to add other newsletter feedback
- Add CTA at bottom of newsletter with link to /feedback page
- Need to generate token per newsletter per user. unique id is (userId, issue_id)
    - For now, allow unlimited number of feedback responses
    - long term, we should invalidate tokens once a user submits feedback
- /feedback page should only be visible if a valid token is added to URL
    - should be extensible to allow anonymous users


if time permits
- 1-5 star rating on feedback.



Code TODOs

- feedback schema (DB)
id, userid, issueid, feedback, createdAt, rating
index: issueid, (issue,rating), userid

- FeedbackService
submitFeedback(user_id, issue_id, feedback);

- FeedbackRepo
submitFeedback(feedback:Feedback);

- POST /api/feedback

{
    token:
    feedback:
}
- validate token
- userId, issueId = decodeFeedbackToken(token)
- await submitFeedback(user_id, issue_id, feedback)
- return 200 OK


- generateFeedbackToken(userId, issueId)
no ttl






- /feedback page
Only show page if valid token is present

- update newsletter template to include feedbackToken