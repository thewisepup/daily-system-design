Ads Admin Dashboard

I need a way to add an ad to a newsletter and track the analytics for it.

I need a way to onboard a new company, create a new campaign id for a company, tag a newsletter with an ad,
and upload contents for the ad like title, text, image, etc.

Long Term
- Admin dashboard
    - onboard company
    - create campaign
    - create ad creative 
    - automate schedule of adding ads
    - adding contracts and deals (number of newsletters/deal)
    - automated adding ads and deciding which add to pick
    - reservation of adding ads on specific dates
    - pull multiple ads/newsletter


Short Term 
    - onboard company
    - create campaign
    - create ad creative
    - manually tag specific newsletter with ad
    - support 1 type of ad, inline ad space (flexible for multiple though)
    - 1 ad/newsletter

Models
- company
- campaign
- adCreative
- adInstance
- adReservation


A company can have multiple campaigns. A campaign will belong to 1 company.
A campaign will have multiple adInstance. 1 adInstance will belong to 1 campaign.
an adCreative can be used for multiple adInstance. 1 adInstance has 1 adCreative.
an adReservation will use 1 adInstance. an adInstance can be used for multiple adReservation.
every adReservation links to 1 issueId.

company
- id
- name
- contactInfo (company name)

campaign
- id
- name
- companyId (FK on company)

adCreative
- id
- title
- text
- link
- imageUrl
- companyId (FK on company)

adInstance
- id
- adCreative (FK on adCreative)
- adType
- adPlacement
- campaignId (FK on campaign)


adReservation
- id
- adInstance (FK on adInstance)
- issueId (FK on issue)
- status (hold, booked, released, etc)
- slot (TODO: figure out if we want slot in adReservation or adInstance)




- As an admin, I can register a company and store their contact information
    - Store contact info and company name
- As an admin, I can create a campaign for a given company
    - Collect campaign details, return campaign ID (should be a slug)
- As an admin, I can upload ad creative for a company (title, text, image)
    - title, text
    - upload an image
- As an admin, I can tag a newsletter to have an ad.
    - connect it to a campaign/company
- As a company, I can see the ad campaign results
    - Open rate
    - Link Click Rate
    - etc.



APIs
company
    - createCompany
    - updateCompany
campaign
    - createCampaign
    - deleteCampaign
adCreative
    -createAdCreative
    -updateAdCreative
adInstance
    - createAdInstance
adReservation
    - createAdReservation(issueId, adCreative, campaignId)

update sendNewsletter workflow to embed ad.

- db schema
- s3 to store images


FE Components

CompanyManagement
- Default to CREATE mode
- Collect Company Info

CampaignManagement
- Default to CREATE mode
- Collect campaign Info
- Returns campaignId / slug to give to advertisers

AdCreativeManagement
- Default to CREATE mode
- Upload title, textbody, link, CTA
- upload image
- returns adCreative ID

AdReservationManagement
- Showcases 5 most recent IssueSummaries
- onSelect, mark ad with adCreative, campaign, 

MockAdvertisment
- given an issueId, title, textbody, link, cta, send a mock ad email




0. Create /admin/ads page
1. Company schema, repo, service, router, FE
2. Campaign schema, repo, service, router, FE
3. AdCreative schema, repo, service, router, FE
4. AdReservation schema, repo, service, router, FE
5. MockAdvertiment