import { Star } from "lucide-react";

// Real customer quotes (published with permission, lightly edited for
// clarity/typos). Also feeds the Review/AggregateRating JSON-LD emitted
// alongside this section on the homepage — see lib/seo.ts#testimonialsJsonLd.
//
// `inSchema: false` marks a quote sourced from a THIRD-PARTY platform (e.g. a
// Google review, shown here with permission). Those are displayed visually but
// deliberately kept OUT of the review schema — Google's structured-data policy
// prohibits marking up reviews collected elsewhere as your own site's reviews.
export const testimonials = [
  {
    author: "Aryeh H.",
    location: "Jerusalem, Yeshiva Vishachanti",
    ratingValue: 5,
    reviewBody:
      "I ported my Israeli number to a BitLink eSIM, and the whole switch took under 5 minutes. My account rep walked me through everything personally.",
  },
  {
    author: "Chana S.",
    location: "Beit Shemesh",
    ratingValue: 5,
    reviewBody:
      "We switched from our old carrier to BitLink's 5G network — excellent customer service, a smooth transition, and zero downtime.",
  },
  {
    author: "Nechama A.",
    location: "Ramat Beit Shemesh A",
    ratingValue: 5,
    reviewBody:
      "Having a US number attached to my Israeli eSIM is huge — my family back in America can call me anytime without worrying about extra fees on their end.",
  },
  {
    author: "Vladimir M.",
    location: "via Google",
    ratingValue: 5,
    reviewBody:
      "One of the best english support I have experienced in Israel so far. Far above all the traditional mobile providers communication style.",
    inSchema: false,
  },
];

function Stars() {
  return (
    <div className="flex gap-0.5" aria-hidden="true">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
      ))}
    </div>
  );
}

export function Testimonials() {
  return (
    <section className="bg-[#f8fbfc] py-16 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 max-w-3xl">
          <p className="text-sm font-semibold text-link-blue">What customers say</p>
          <h2 className="mt-3 text-balance text-3xl font-semibold tracking-normal text-ink sm:text-5xl">
            Real switches, real reviews.
          </h2>
          <div className="mt-4 flex items-center gap-3">
            <Stars />
            <p className="text-sm font-semibold text-ink">5.0 out of 5, from BitLink customers</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {testimonials.map((t) => (
            <figure
              key={t.author}
              className="flex flex-col rounded-lg border border-ink/10 bg-white p-6 shadow-sm"
            >
              <Stars />
              <blockquote className="mt-4 flex-1 text-sm leading-6 text-slate-700">
                &ldquo;{t.reviewBody}&rdquo;
              </blockquote>
              <figcaption className="mt-5 border-t border-ink/8 pt-4">
                <p className="text-sm font-semibold text-ink">{t.author}</p>
                <p className="text-xs text-muted-slate">{t.location}</p>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
