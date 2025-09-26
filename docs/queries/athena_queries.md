-- Get metrics for transactional emails by campaign id

WITH events AS (
    SELECT
        json_extract_scalar(mail.tags['campaign_id'], '$[0]') AS campaign_id,
        eventtype,
        mail.messageId
    FROM transactional_events
    WHERE mail.tags['campaign_id'] IS NOT NULL
)

SELECT
    campaign_id,
    COUNT_IF(eventtype = 'Send')              AS sends,
    COUNT_IF(eventtype = 'Delivery')          AS deliveries,
    COUNT(DISTINCT CASE WHEN eventtype = 'Open' THEN messageId END) AS opens,
    CAST(
        COUNT(DISTINCT CASE WHEN eventtype = 'Open' THEN messageId END) AS DOUBLE
    )
    / NULLIF(COUNT_IF(eventtype = 'Delivery'), 0) AS ctr
FROM events
GROUP BY campaign_id
ORDER BY campaign_id;


-- Get Email metrics for welcome email

SELECT 
    json_extract_scalar(mail.tags['transactional_email_type'], '$[0]') AS email_type,

    COUNT_IF(eventtype = 'Send') AS sends,
    COUNT_IF(eventtype = 'Delivery') AS deliveries,

    COUNT(
      DISTINCT CASE 
        WHEN eventtype = 'Open' 
        THEN CONCAT(mail.messageId, ':', mail.commonHeaders.to[1]) 
      END
    ) AS unique_opens,

    CAST(
      COUNT(
        DISTINCT CASE 
          WHEN eventtype = 'Open' 
          THEN CONCAT(mail.messageId, ':', mail.commonHeaders.to[1]) 
        END
      ) AS DOUBLE
    ) / NULLIF(COUNT_IF(eventtype = 'Delivery'), 0) AS ctr

FROM transactional_events
WHERE json_extract_scalar(mail.tags['transactional_email_type'], '$[0]') = 'welcome'
GROUP BY json_extract_scalar(mail.tags['transactional_email_type'], '$[0]');


-- Get Email Metrics For All Newsletter Issue
SELECT
    json_extract_scalar(mail.tags['issue_number'], '$[0]') AS issue_number,

    COUNT_IF(eventtype = 'Send')      AS sends,
    COUNT_IF(eventtype = 'Delivery')  AS deliveries,

    COUNT(
      DISTINCT CASE WHEN eventtype = 'Open'
        THEN CONCAT(mail.messageId, ':', mail.commonHeaders.to[1])
      END
    ) AS unique_opens,

    CAST(
      COUNT(
        DISTINCT CASE WHEN eventtype = 'Open'
          THEN CONCAT(mail.messageId, ':', mail.commonHeaders.to[1])
      END
    ) AS DOUBLE
    ) / NULLIF(COUNT_IF(eventtype = 'Delivery'), 0) AS ctr

FROM newsletter_events
WHERE mail.tags['issue_number'] IS NOT NULL
GROUP BY json_extract_scalar(mail.tags['issue_number'], '$[0]')
ORDER BY CAST(json_extract_scalar(mail.tags['issue_number'], '$[0]') AS integer);