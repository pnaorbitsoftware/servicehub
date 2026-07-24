import { Star, MapPin } from "lucide-react";

export default function ModernProviders({ services = [], setSelectedService }) {
  return (
    <section id="providers" className="bg-white py-20 transition-colors dark:bg-slate-950">
      <div className="mx-auto max-w-[1400px] px-6">
        <div className="mb-12 flex items-center justify-between">
          <div>
            <span className="rounded-full bg-blue-100 px-4 py-2 text-sm font-semibold text-blue-700 dark:bg-blue-500/15 dark:text-blue-300">
              Trusted Professionalss
            </span>

            <h2 className="mt-5 text-4xl font-extrabold text-slate-900 dark:text-white">
              Top rated service providers
            </h2>

            <p className="mt-3 text-slate-600 dark:text-slate-300">
              Compare ratings, pricing and availability.
            </p>
          </div>

          <div className="rounded-full border border-slate-200 px-5 py-2 font-semibold text-slate-700 dark:border-white/10 dark:text-slate-200">
            {services.length} Providers
          </div>
        </div>

        <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-4">
          {services.slice(0, 8).map((service, index) => (
            <div
              key={service.id || service.providerId || service.name || index}
              className="overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-sm transition hover:-translate-y-2 hover:shadow-xl dark:border-white/10 dark:bg-slate-900"
            >
              <img
                src={service.image}
                alt={service.name}
                className="h-56 w-full object-cover"
              />

              <div className="p-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                    {service.name}
                  </h3>

                  <span className="flex items-center gap-1 text-sm font-semibold">
                    <Star
                      size={14}
                      className="fill-yellow-400 text-yellow-400"
                    />
                    {service.rating || 4.8}
                  </span>
                </div>

                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                  {service.category}
                </p>

                <div className="mt-3 flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                  <MapPin size={14} />
                  {service.location || "Available nearby"}
                </div>

                <div className="mt-4 text-lg font-bold text-blue-600">
                  {service.price}
                </div>

                <div className="mt-5 flex gap-3">
                  <button
                    onClick={() =>
                      setSelectedService && setSelectedService(service)
                    }
                    className="flex-1 rounded-xl border border-slate-300 py-2 font-medium dark:border-white/15 dark:text-slate-100"
                  >
                    View Profile
                  </button>

                  <button
                    onClick={() =>
                      setSelectedService && setSelectedService(service)
                    }
                    className="flex-1 rounded-xl bg-blue-600 py-2 font-medium text-white"
                  >
                    Book Now
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

