# RN CF Launchpad

Ubiquitous language for the B2C launchpad: authenticated people, multi-member organizations, and paid access.

## Language

**User**:
A person who can sign in and act in the product. At signup they receive an Organization of one, which becomes their first Active Organization. They may create further Organizations or join others by Invitation.
_Avoid_: Customer (when you mean the person)

**Account**:
The User’s login identity and personal data lifecycle — credentials, export, and deletion. Not the paying subject and not an Organization.
_Avoid_: Organization, Subscription holder, team account

**Organization**:
The group that owns membership and the subscription. A solo adult is an Organization of one; that case is not a separate kind of Organization.
_Avoid_: Household, family, team, workspace, personal account (as a distinct paying type)

**Membership**:
The relationship that ties a User to an Organization with a role. Ending Membership immediately ends that User’s use of the Organization’s Entitlement. Member count is not a billed quantity in this launchpad.
_Avoid_: Seat

**Owner**:
A Membership role with full control of the Organization, including Subscription management.

**Admin**:
A Membership role that may manage members and the Subscription, but is not the Owner.

**Member**:
A Membership role that may use the Organization’s Entitlement but must not buy or manage the Subscription.
_Avoid_: User (when you mean the role inside an Organization)

**Invitation**:
A pending offer for a User (by email) to gain Membership in an Organization. Accepting creates Membership; paid access then follows that Organization’s Entitlement when it is Active.
_Avoid_: Seat invite, share link (unless you later mean a different mechanism)

**Active Organization**:
The Organization the User is currently acting in. Paid access is evaluated only for this Organization, not for every Membership the User has.
_Avoid_: Current account, selected workspace (as domain terms)

**Subscription**:
The commercial agreement with a payment provider for an Organization — period, renew or cancel, and provider identity. Provider customers map to the Organization, not to the User who checked out.
_Avoid_: Entitlement, purchase (when you mean the ongoing agreement), Product, Offering, Package (as ubiquitous language — those stay provider/catalog words)

**Grant**:
A normalized provider-sourced access fact for an Organization (from Stripe, RevenueCat, or similar). One Organization may have several Grants at once.
_Avoid_: Entitlement (when you mean a single provider fact), receipt

**Entitlement**:
The derived aggregate that an Organization currently has paid access for a capability key, computed from its Grants. When present, it covers every Member of that Organization while it is Active. The API authorizes features from this, not from client or store UI state. Capability keys (for example `pro` or `premium`) are catalog config, not domain nouns.
_Avoid_: Subscription (when you mean authorization), Grant (when you mean the aggregate), Pro, Premium (as ubiquitous language), Seat

**Grace Period**:
A limited window where paid access continues after a billing problem on a Grant. If not repaired in time, that Grant stops contributing to Entitlement.
_Avoid_: Trial, extension (when you mean post-failure access)

**Trial**:
Time-limited access before or without a successful paid period. Not a billing-failure state. How a Trial starts or gets extended (campaigns, challenges, social promos) is product policy, not separate launchpad domain types. A permanent free tier is simply the absence of Entitlement (or fewer features), not a glossary noun.
_Avoid_: Grace Period, freemium, Free, Campaign (as launchpad ubiquitous language)
