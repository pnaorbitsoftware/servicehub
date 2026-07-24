// Deprecated component.
// Currently unused.
// Kept temporarily for future cleanup/refactor.

import { BriefcaseBusiness } from "lucide-react";
import { motion } from "framer-motion";

export default function ModernPopularServices({ openPopularService }) {
  const popular = [
    {
      title: "AC Repair",
      note: "Cleaning, gas refill, installation",
      image:
        "https://upload.wikimedia.org/wikipedia/commons/thumb/1/18/Wall_mount_air_conditioner.jpg/960px-Wall_mount_air_conditioner.jpg",
    },
    {
      title: "Plumber",
      note: "Leaks, fittings, emergency repairs",
      image:
        "https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?auto=format&fit=crop&w=640&q=80",
    },
    {
      title: "Electrician",
      note: "Wiring, fixtures, safety checks",
      image:
        "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=640&q=80",
    },
    {
      title: "Appliance Repair",
      note: "Fridge, TV, washing machine",
      image:
        "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=640&q=80",
    },
    {
      title: "Carpentry",
      note: "Furniture, doors, modular fittings",
      image:
        "https://images.unsplash.com/photo-1601058268499-e52658b8bb88?auto=format&fit=crop&w=640&q=80",
    },
  ];

  const duplicatedCards = [...popular, ...popular];

  const cardHoverVariants = {
    hover: {
      y: -18,
      scale: 1.04,
      boxShadow:
        "0 30px 60px rgba(0,0,0,0.15), 0 10px 30px rgba(37,99,235,0.08)",
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 15,
      },
    },
    tap: {
      scale: 0.96,
    },
  };

  const handleViewAll = () => {
    const providersSection = document.getElementById("providers");

    if (providersSection) {
      providersSection.scrollIntoView({
        behavior: "smooth",
      });
    } else {
      window.location.href = "/providers";
    }
  };

  return (
    <section className="overflow-hidden bg-white py-12 transition-colors dark:bg-[#081229]">
      <div className="mx-auto max-w-[1400px] px-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <span className="inline-block rounded-full bg-blue-100 px-4 py-2 text-sm font-semibold text-blue-700 dark:bg-blue-500/15 dark:text-blue-300">
              Popular Services
            </span>

            <h2 className="mt-5 text-4xl font-extrabold text-slate-900 dark:text-white">
              Home services for every need
            </h2>

            <p className="mt-4 text-slate-600 dark:text-slate-300">
              Trusted professionals ready to help.
            </p>
          </div>

          <button
            onClick={handleViewAll}
            type="button"
            className="font-semibold text-blue-600 group flex items-center gap-1 hover:text-blue-800 transition-colors"
          >
            View all services
            <span className="inline-block transition-transform duration-300 group-hover:translate-x-1">
              →
            </span>
          </button>
        </div>

        {/* Continuous Sliding Cards */}
        <div className="relative overflow-hidden mt-12">
          <motion.div
            className="flex gap-6 w-max"
            animate={{ x: ["0%", "-50%"] }}
            transition={{
              duration: 20,
              ease: "linear",
              repeat: Infinity,
            }}
          >
            {duplicatedCards.map((service, index) => (
              <motion.button
                key={`${service.title}-${index}`}
                onClick={() => openPopularService?.(service.title)}
                variants={cardHoverVariants}
                whileHover="hover"
                whileTap="tap"
                className="group relative w-[240px] flex-shrink-0 overflow-hidden rounded-[28px] border border-slate-200 bg-white text-left shadow-sm dark:border-white/10 dark:bg-[#0B1F3A]"
              >
                <div className="relative overflow-hidden">
                  <img
                    src={service.image}
                    alt={service.title}
                    className="h-52 w-full object-cover transition-all duration-700 group-hover:scale-110"
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                  <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 text-xs font-semibold text-blue-600 opacity-0 group-hover:opacity-100 transition-all duration-300">
                    Book Now
                  </div>
                </div>

                <div className="p-5">
                  <div className="text-blue-600">
                    <BriefcaseBusiness size={22} />
                  </div>

                  <h3 className="mt-3 text-xl font-bold text-slate-900 dark:text-white">
                    {service.title}
                  </h3>

                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{service.note}</p>

                  <div className="mt-4 h-0.5 w-0 bg-blue-600 rounded-full transition-all duration-500 group-hover:w-full" />
                </div>
              </motion.button>
            ))}
          </motion.div>
        </div>

        {/* Stats */}
        <div className="mt-12 grid grid-cols-2 gap-6 rounded-[32px] border border-slate-200 bg-slate-50 p-10 dark:border-white/10 dark:bg-[#0B1F3A] md:grid-cols-4">
          <div className="text-center">
            <h3 className="text-3xl font-extrabold text-blue-600">10k+</h3>
            <p className="mt-2 text-slate-600 dark:text-slate-300">Happy Customers</p>
          </div>

          <div className="text-center">
            <h3 className="text-3xl font-extrabold text-blue-600">4.8★</h3>
            <p className="mt-2 text-slate-600 dark:text-slate-300">Average Rating</p>
          </div>

          <div className="text-center">
            <h3 className="text-3xl font-extrabold text-blue-600">500+</h3>
            <p className="mt-2 text-slate-600 dark:text-slate-300">Verified Experts</p>
          </div>

          <div className="text-center">
            <h3 className="text-3xl font-extrabold text-blue-600">24/7</h3>
            <p className="mt-2 text-slate-600 dark:text-slate-300">Support</p>
          </div>
        </div>
      </div>
    </section>
  );
}
