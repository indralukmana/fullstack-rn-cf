---
title: Paywall experiment notes
description: Parked external learnings on mobile paywall design and experiments. Not product policy.
---

**Status: parked.** Captured for later. Do not treat this as launchpad policy, an ADR, or a
build ticket. Product billing rules stay in [Billing and entitlements](/billing/).

## Source

- Video: [He Tested 4,700 Paywalls. These Won.](https://www.youtube.com/watch?v=E7RzEZ8GlHE)
  (YouTube `E7RzEZ8GlHE`)
- Guest: Jonathan (paywall designer; interview claims ~4,700 paywalls)
- Captured: 2026-09-06 via local `yt-summary --parakeet --transcript-only`
- ASR: Handy Parakeet Unified EN 0.6B. Transcript may contain minor errors.

## Core frame

Pick the business game before crowning a winner:

| Game                     | Optimize for          | Risk                                          |
| ------------------------ | --------------------- | --------------------------------------------- |
| Short-term / weekly cash | ARPU                  | High churn; dark-pattern funnels can "win"    |
| Long-term product        | LTV, retention, churn | Leave some short-term conversion on the table |

Highest-converting creative is not always the right paywall for the business you want.

## Ship first

Early products do not need placement and creative optimization. A first paywall can be:

1. Headline that describes the product
2. A few bullets on what it does
3. Continue / subscribe CTA

Get users into the app. Optimize once traffic exists.

## What to test first (needle size)

1. **Design (largest).** Radical variants, not tweaks: video, bullet list, trial timeline,
   long-form.
2. **Personalization.** Name, goals, identity-matching imagery from onboarding answers.
3. **Price packaging / footer.** Yearly vs weekly layout (vertical vs horizontal), default
   selection, how price is shown (for example weekly-equivalent with real price as subtitle).
4. **Device / context pricing (last).** Higher price for newer device, better network, not in low
   battery. High effort, small gains. Store policy and fairness constraints may limit this.

**Packaging heuristics to treat as hypotheses:** default yearly for LTV; show two plans to reduce
cognitive load; yearly may still be wrong for a given catalog.

## Metrics

| Signal                                    | Notes                                                                        |
| ----------------------------------------- | ---------------------------------------------------------------------------- |
| Paywall view rate (install → see paywall) | >80% solid; ≥90% strong                                                      |
| Trial → paid                              | Core conversion                                                              |
| LTV, D1 / D7 / D30, churn                 | For durable businesses                                                       |
| ARPU alone                                | Misleading. High ARPU often comes from weeklies with very high monthly churn |

Suggested experiment shape: keep current paywall as control; ship four to five radical challengers.
Expect some apps to need a second or third round before a significant win.

## Touchpoints (lifecycle)

| Moment                   | Idea                                               |
| ------------------------ | -------------------------------------------------- |
| After onboarding         | Dominant pattern cited (~78% of iOS apps on Mobin) |
| Feature gate             | Unlock a specific capability                       |
| Settings                 | Soft / always-available upsell                     |
| Cancel flow              | Winback discount                                   |
| Delete / "before you go" | Last-chance offer                                  |

Account before vs after the paywall: inconclusive across categories in the interview. Preference
stated: create account first, then show the paywall, so the subscriber ties to a user id. Launchpad
already requires a verified account before checkout or native purchase UI; see
[Billing](/billing/).

## Discount discipline

- Steep winback on cancel: acceptable in the interviewer's view.
- Heavy post-onboarding discount (for example 80% off immediately): avoid. Cannibalizes people who
  would convert or see another paywall at full price.
- Training users that closing a paywall yields a better offer teaches dismissals.

## Practices to treat carefully

**Spin-the-wheel** (predetermined "lottery" discount): can raise short-term weekly revenue; weak fit
for a long-term trust-oriented product. Highest converter is not automatically correct.

## Parked experiment backlog

Not scheduled. For when product work resumes:

1. Design bake-off: control vs video vs trial-timeline vs long-form (four to five variants).
2. Two-plan footer: yearly default + weekly; vertical vs horizontal; weekly-equivalent price display.
3. Auth order only if product policy changes; today verified account precedes purchase UI.
4. Placement: post-onboarding only vs plus feature gate vs plus settings entry.
5. Discount timing: no post-onboarding discount vs winback-only on cancel/delete.
6. Personalization: onboarding answers → named goals / identity creative on the wall.
7. Metric dashboard: paywall view %, trial→paid, LTV, D7/D30, churn. Choose ARPU vs LTV as primary
   before crowning a winner.

## Full transcript

```text
I spoke to someone who's designed 4,700 paywalls. How important is paywall optimization? As a starting point, it's honestly not that important. And the highest converting paywall isn't always the one that you should use. Unfortunately, it works. So today we are unpacking the biggest growth lessons from thousands of paywall experiments and why most founders are optimizing the wrong thing. For your first paywall, honestly, all that you need to do is to have a headline describing the product, a couple bullet points describing the product and what it does, and a button to continue. I get in calls with some people that think they need to do all these crazy optimizations for their placements and paywalls in the beginning. You really don't. You just need to make sure that you're getting users into your app first and then you can optimize that traffic later. When you run a paywall experiment, how do you decide what's worth testing first? Design tests move the needle the most. So you try radically different designs until you find something that blows everything out of the water. You could have a video paywall. You could have bullet list paywall, a trial timeline paywall, a long form paywall. After design, personalization moves the needle the most, calling out their name, highlighting their goals. So if they're male or female and it's a fitness app, you can show like a strong man on the paywall and it's representative of the user's identity and then price packaging design. So how do you design the footer of the paywall? If you have a yearly and a weekly product, are they vertical product groups? Are they horizontal? What do you put in those product groups? How do you present the price? Do you show it as weekly for both options with a subtitle that shows the actual real price or how do you go about that? Ideally, you want to default to a yearly product because we see that that has the highest LTV. You only want to show two to decrease cognitive load on the user, but a yearly product may not be the best for your business. You can also start doing tests based on what kind of device the user has. If the user is on an iPhone 17 Pro, they're on 5G and don't have low battery mode, show them a higher price as opposed to a user that's on an iPhone 13 Pro on 3G and their low battery indicator is working. Maybe you want to show them a lower price because they may or may not convert at the higher price. But that's like one of the last levers that you really pull because it's so much work. It incrementally gets smaller and smaller in what moves the needle. What do you think are the metrics that matter the most when you're evaluating a paywall experiment? That depends entirely on the business. I used to use ARPU as my North Star metric, but ARPU doesn't necessarily give you all the answers. Your ARPU may be high. You may have $3 or $4 ARPU, but the reason you may have $3 or $4 ARPU is because you have weekly products. And so your churn may be 90 to 95% per month, even though ARPU is high and it looks good. It doesn't tell you the full picture. I typically look at paywall percentage, how many people are actually looking at the paywall that install the app. If it's above 80%, you're doing good. If it's 90% or above, you're crushing. I look at trial to paid conversion rate, LTV, D1, D7, D30, churn. And then based on the kind of customer that they are, I'll suggest different things. If you're vibe coding an app and you just want to build something and launch it and get as many users as possible, then you're going to be focusing on ARPU as the key metric. But if you're building like a long-term business, you want to maximize revenue while still balancing churn, then optimize for LTV and retention. We would take your paywall, use that as the control, and then we would design four to five paywalls to go against it. For all of our clients so far, we are able to beat the control in the first week for every app except two. It ended up taking until the second or third experiment to really see a statistically significant win for them when you're doing experimentation. You just have to be patient also. It's not always going to work out. How about the paywall touch points? How important is it to test that? All the different touch points are extremely important. Onboarding paywalls, gated paywalls that gate some kind of feature, paywalls in the settings page. Paywalls for if the user wants to cancel their account, you can win them back showing them some kind of discounted offer. A paywall for when they're about to delete the app. You'll say, before you go or before you delete, we'd love for you to try one last time when it comes to what is the most used paywall. It's the after onboarding paywall. In fact, 78% of iOS apps on Mobin show the paywall after onboarding. Now, do you create an account before or after that you have to test actually because I have tested it multiple times and I still have inconclusive results and I think it's just because it's all been in different app categories. I like to create an account first and then show the paywall. That way I can tie a user ID to the person that's actually subscribing. So you have to think about the entire life cycle of the customer. It's literally the only part of the app that makes you money. Having a steep discount in your Winback campaign, I think is okay. I don't really like it when apps immediately go for the 80% off discount after onboarding because you could be cannibalizing revenue by showing them such a discounted offer before they've even had the chance to go back and see a paywall a few more times. But if they're subscribed already and they're thinking about canceling, showing them a lower rate before you do a bunch of price testing is a cool way for you to keep your customers that are thinking of churning anyway. What's a paywall best practice you completely disagree with is the spin the wheel paywall. This is a predetermined spin the wheel lotty file that may land on some kind of discounted percentage. If you're optimizing for a longer term business that may not be a good paywall for you but if you're optimizing for a weekly price and you want to maximize revenue unfortunately it works the issue is that I think more and more users are getting comfortable closing paywalls because they know they're going to get some kind of offer afterwards for the apps that want to build a really good business. Just remember that this is a long-term game. Throughout this conversation, Jonathan kept coming back to the same question. What kind of business are you trying to build? Neither of these are right or wrong, but they're very different games. Next up, watch this paywall video on why some of them work and some don't.
```
