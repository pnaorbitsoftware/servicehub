import { AnimatePresence, motion } from "framer-motion";
import ModernHero from "../../components/redesign/ModernHero";
import ModernPopularServices from "../../components/redesign/ModernPopularServices";
import NewAdminPanel from "../../components/admin/NewAdminPanel";
import ModernNavbar from "../../components/redesign/ModernNavbar";
import HelpSupportCenter from "../../components/support/HelpSupportCenter";
import {
  ArrowLeft,
  ArrowRight,
  Bell,
  BriefcaseBusiness,
  CalendarCheck,
  Camera,
  ChevronRight,
  CheckCircle,
  Clock,
  CreditCard,
  Heart,
  House,
  IndianRupee,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Mail,
  MapPin,
  Menu,
  MessageCircle,
  Send,
  ShieldCheck,
  Sparkles,
  Star,
  Trash2,
  UserRound,
  UploadCloud,
  Wallet,
  X,
  XCircle,
  Phone,
  RefreshCw,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  acceptEstimate,
  createRazorpayOrder,
  getProviderEarnings,
  loadRazorpayScript,
  rejectEstimate,
  submitProviderEstimate,
  verifyRazorpayPayment,
  withdrawProviderEarnings,
} from "../../api/payments";
import AuthModal from "../../components/authModal/AuthModal";
import EstimateStatusBadge from "../../components/payments/EstimateStatusBadge";
import PaymentStatusBadge from "../../components/payments/PaymentStatusBadge";
import PaymentSummaryCard from "../../components/payments/PaymentSummaryCard";
import ProviderEstimateModal from "../../components/payments/ProviderEstimateModal";
import RejectEstimateModal from "../../components/payments/RejectEstimateModal";
import ServiceModal from "../../components/serviceCard/ServiceModal";
import "../../components/tracking/Tracking.css";
import ProviderRoutePanel from "../../components/tracking/ProviderRoutePanel";
import {
  formatTrackingEventTime,
  getActiveStepIndex,
  getLatestTrackingEvent,
  normalizeTrackingStatus,
  trackingSteps,
} from "../../components/tracking/trackingShared";
import useProviderAlerts from "../../components/tracking/useProviderAlerts";
import SEO from "../../seo/SEO";
import { API_URL, AUTH_API_URLS, SOCKET_API_URL } from "../../config/api";
import {
  buildBreadcrumbSchema,
  faqItems,
  faqSchema,
  localBusinessSchema,
  organizationSchema,
  reviewSchema,
  serviceSchema,
  targetKeywords,
} from "../../seo/seoData";

let catalogRequestPromise = null;
const fetchCatalogSnapshot = () => {
  if (!catalogRequestPromise) {
    catalogRequestPromise = fetch(`${API_URL}/catalog`)
      .then((response) => (response.ok ? response.json() : { providers: [] }))
      .finally(() => {
        catalogRequestPromise = null;
      });
  }
  return catalogRequestPromise;
};
const SERVICEHUB_ICON = "/servicehub-icon.png";

const supportedLanguages = [
  { code: "en", label: "English", short: "EN" },
  { code: "hi", label: "हिंदी", short: "HI" },
  { code: "mr", label: "मराठी", short: "MR" },
];

const translations = {
  en: {
    verifiedLocalServices: "Verified local services",
    home: "Home",
    services: "Services",
    providers: "Providers",
    dashboard: "Dashboard",
    clientDashboard: "Client Dashboard",
    providerDashboard: "Provider Dashboard",
    admin: "Admin",
    contactUs: "Contact Us",
    login: "Login",
    logout: "Logout",
    provider: "Provider",
    becomeProvider: "Become a Provider",
    signedIn: "Signed in",
    light: "Light",
    dark: "Dark",
    language: "Language",
    browseServices: "Browse services",
    providerDashboardButton: "Provider dashboard",
    bookAnotherService: "Book another service",
    workspace: "ServiceHub workspace",
    clientBookingDashboard: "Client Booking Dashboard",
    clientDashboardTitle: "Client Dashboard",
    clientDashboardSubtitle:
      "Track bookings, saved providers, service progress, and reviews.",
    providerClientSubtitle:
      "Book services for your own need from the same provider account.",
  },
  hi: {
    verifiedLocalServices: "सत्यापित स्थानीय सेवाएं",
    home: "होम",
    services: "सेवाएं",
    providers: "प्रदाता",
    dashboard: "डैशबोर्ड",
    clientDashboard: "क्लाइंट डैशबोर्ड",
    providerDashboard: "प्रदाता डैशबोर्ड",
    admin: "एडमिन",
    contactUs: "संपर्क करें",
    login: "लॉगिन",
    logout: "लॉगआउट",
    provider: "प्रदाता",
    becomeProvider: "प्रदाता बनें",
    signedIn: "साइन इन",
    light: "लाइट",
    dark: "डार्क",
    language: "भाषा",
    browseServices: "सेवाएं देखें",
    providerDashboardButton: "प्रदाता डैशबोर्ड",
    bookAnotherService: "दूसरी सेवा बुक करें",
    workspace: "ServiceHub कार्यक्षेत्र",
    clientBookingDashboard: "क्लाइंट बुकिंग डैशबोर्ड",
    clientDashboardTitle: "क्लाइंट डैशबोर्ड",
    clientDashboardSubtitle:
      "बुकिंग, सेव किए गए प्रदाता, सेवा प्रगति और समीक्षा ट्रैक करें.",
    providerClientSubtitle:
      "इसी प्रदाता खाते से अपनी जरूरत के लिए सेवाएं बुक करें.",
  },
  mr: {
    verifiedLocalServices: "सत्यापित स्थानिक सेवा",
    home: "होम",
    services: "सेवा",
    providers: "प्रदाता",
    dashboard: "डॅशबोर्ड",
    clientDashboard: "क्लायंट डॅशबोर्ड",
    providerDashboard: "प्रदाता डॅशबोर्ड",
    admin: "अॅडमिन",
    contactUs: "संपर्क करा",
    login: "लॉगिन",
    logout: "लॉगआउट",
    provider: "प्रदाता",
    becomeProvider: "प्रदाता बना",
    signedIn: "साइन इन",
    light: "लाइट",
    dark: "डार्क",
    language: "भाषा",
    browseServices: "सेवा पहा",
    providerDashboardButton: "प्रदाता डॅशबोर्ड",
    bookAnotherService: "दुसरी सेवा बुक करा",
    workspace: "ServiceHub कार्यक्षेत्र",
    clientBookingDashboard: "क्लायंट बुकिंग डॅशबोर्ड",
    clientDashboardTitle: "क्लायंट डॅशबोर्ड",
    clientDashboardSubtitle:
      "बुकिंग, सेव्ह केलेले प्रदाता, सेवा प्रगती आणि पुनरावलोकने ट्रॅक करा.",
    providerClientSubtitle: "त्याच प्रदाता खात्यातून स्वतःसाठी सेवा बुक करा.",
  },
};

const getSavedLanguage = () => {
  const savedLanguage = localStorage.getItem("servicehub_language") || "en";
  return supportedLanguages.some((language) => language.code === savedLanguage)
    ? savedLanguage
    : "en";
};

const pageTextTranslations = {
  hi: {
    "Home services, booked clearly": "होम सेवाएं, साफ तरीके से बुक करें",
    "Compare providers, check pricing, choose a time, and track the request from one clean ServiceHub workspace.":
      "प्रदाताओं की तुलना करें, कीमत देखें, समय चुनें और एक ही ServiceHub कार्यक्षेत्र से अनुरोध ट्रैक करें.",
    "Search services, providers, or city": "सेवा, प्रदाता या शहर खोजें",
    Search: "खोजें",
    "Book Now": "अभी बुक करें",
    "View Details": "विवरण देखें",
    Providers: "प्रदाता",
    "Providers category": "प्रदाता श्रेणी",
    "See more providers": "और प्रदाता देखें",
    "Show less providers": "कम प्रदाता दिखाएं",
    "Popular services": "लोकप्रिय सेवाएं",
    "Booking history": "बुकिंग इतिहास",
    "Pending bookings": "लंबित बुकिंग",
    "Active bookings": "सक्रिय बुकिंग",
    "Completed services": "पूर्ण सेवाएं",
    "Cancelled services": "रद्द सेवाएं",
    "Completed Services": "पूर्ण सेवाएं",
    "Cancelled Services": "रद्द सेवाएं",
    "Completed service details": "पूर्ण सेवा विवरण",
    "Cancelled service details": "रद्द सेवा विवरण",
    "My bookings": "मेरी बुकिंग",
    "Saved providers": "सेव प्रदाता",
    "Pending reviews": "लंबित समीक्षा",
    Pending: "लंबित",
    Active: "सक्रिय",
    Completed: "पूर्ण",
    Cancelled: "रद्द",
    "Browse services": "सेवाएं देखें",
    "Provider dashboard": "प्रदाता डैशबोर्ड",
    "Book another service": "दूसरी सेवा बुक करें",
    Provider: "प्रदाता",
    Date: "तारीख",
    Service: "सेवा",
    Money: "राशि",
    Address: "पता",
    Problem: "समस्या",
    "Payment & Estimate": "भुगतान और अनुमान",
    "Provider Starting Price": "प्रदाता शुरुआती कीमत",
    "Final Estimate": "अंतिम अनुमान",
    "Payment Status": "भुगतान स्थिति",
    "Registered on platform": "प्लेटफॉर्म पर रजिस्टर्ड",
    "Rate this service": "इस सेवा को रेट करें",
    "Your review": "आपकी समीक्षा",
    "Submit review": "समीक्षा जमा करें",
    "Update review": "समीक्षा अपडेट करें",
    "Write a short review for this provider...":
      "इस प्रदाता के लिए छोटी समीक्षा लिखें...",
    "Client Dashboard": "क्लाइंट डैशबोर्ड",
    "Provider Dashboard": "प्रदाता डैशबोर्ड",
    "Admin Panel": "एडमिन पैनल",
    "Refresh dashboard": "डैशबोर्ड रीफ्रेश करें",
    "New client requests": "नए क्लाइंट अनुरोध",
    "Confirmed service jobs": "पुष्ट सेवा कार्य",
    "Client history": "क्लाइंट इतिहास",
    "Open all history": "पूरा इतिहास खोलें",
    "Book as client": "क्लाइंट के रूप में बुक करें",
    Logout: "लॉगआउट",
    Login: "लॉगिन",
    "Become a Provider": "प्रदाता बनें",
    "Contact Us": "संपर्क करें",
    FAQ: "सामान्य प्रश्न",
    Services: "सेवाएं",
    Support: "सहायता",
    Company: "कंपनी",
    About: "हमारे बारे में",
    Careers: "करियर",
  },
  mr: {
    "Home services, booked clearly": "होम सेवा, सोप्या पद्धतीने बुक करा",
    "Compare providers, check pricing, choose a time, and track the request from one clean ServiceHub workspace.":
      "प्रदाते तुलना करा, किंमत तपासा, वेळ निवडा आणि एकाच ServiceHub कार्यक्षेत्रातून विनंती ट्रॅक करा.",
    "Search services, providers, or city": "सेवा, प्रदाता किंवा शहर शोधा",
    Search: "शोधा",
    "Book Now": "आता बुक करा",
    "View Details": "तपशील पहा",
    Providers: "प्रदाता",
    "Providers category": "प्रदाता श्रेणी",
    "See more providers": "अधिक प्रदाते पहा",
    "Show less providers": "कमी प्रदाते दाखवा",
    "Popular services": "लोकप्रिय सेवा",
    "Booking history": "बुकिंग इतिहास",
    "Pending bookings": "प्रलंबित बुकिंग",
    "Active bookings": "सक्रिय बुकिंग",
    "Completed services": "पूर्ण सेवा",
    "Cancelled services": "रद्द सेवा",
    "Completed Services": "पूर्ण सेवा",
    "Cancelled Services": "रद्द सेवा",
    "Completed service details": "पूर्ण सेवा तपशील",
    "Cancelled service details": "रद्द सेवा तपशील",
    "My bookings": "माझ्या बुकिंग",
    "Saved providers": "सेव्ह प्रदाते",
    "Pending reviews": "प्रलंबित पुनरावलोकने",
    Pending: "प्रलंबित",
    Active: "सक्रिय",
    Completed: "पूर्ण",
    Cancelled: "रद्द",
    "Browse services": "सेवा पहा",
    "Provider dashboard": "प्रदाता डॅशबोर्ड",
    "Book another service": "दुसरी सेवा बुक करा",
    Provider: "प्रदाता",
    Date: "तारीख",
    Service: "सेवा",
    Money: "रक्कम",
    Address: "पत्ता",
    Problem: "समस्या",
    "Payment & Estimate": "पेमेंट आणि अंदाज",
    "Provider Starting Price": "प्रदाता सुरू किंमत",
    "Final Estimate": "अंतिम अंदाज",
    "Payment Status": "पेमेंट स्थिती",
    "Registered on platform": "प्लॅटफॉर्मवर नोंदणीकृत",
    "Rate this service": "या सेवेला रेट करा",
    "Your review": "तुमचे पुनरावलोकन",
    "Submit review": "पुनरावलोकन सबमिट करा",
    "Update review": "पुनरावलोकन अपडेट करा",
    "Write a short review for this provider...":
      "या प्रदात्यासाठी छोटा अभिप्राय लिहा...",
    "Client Dashboard": "क्लायंट डॅशबोर्ड",
    "Provider Dashboard": "प्रदाता डॅशबोर्ड",
    "Admin Panel": "अॅडमिन पॅनेल",
    "Refresh dashboard": "डॅशबोर्ड रीफ्रेश करा",
    "New client requests": "नवीन क्लायंट विनंत्या",
    "Confirmed service jobs": "पुष्टी झालेली सेवा कामे",
    "Client history": "क्लायंट इतिहास",
    "Open all history": "पूर्ण इतिहास उघडा",
    "Book as client": "क्लायंट म्हणून बुक करा",
    Logout: "लॉगआउट",
    Login: "लॉगिन",
    "Become a Provider": "प्रदाता बना",
    "Contact Us": "संपर्क करा",
    FAQ: "प्रश्नोत्तरे",
    Services: "सेवा",
    Support: "सहाय्य",
    Company: "कंपनी",
    About: "आमच्याबद्दल",
    Careers: "करिअर",
  },
};

const originalTextNodes = new WeakMap();

const reversePageTextTranslations = Object.fromEntries(
  Object.entries(pageTextTranslations).map(([language, dictionary]) => [
    language,
    Object.fromEntries(
      Object.entries(dictionary).map(([source, target]) => [target, source]),
    ),
  ]),
);

const restoreEnglishText = (text = "") => {
  const leading = text.match(/^\s*/)?.[0] || "";
  const trailing = text.match(/\s*$/)?.[0] || "";
  let restored = text.trim();

  Object.values(reversePageTextTranslations).forEach((dictionary) => {
    restored = Object.entries(dictionary)
      .sort(([left], [right]) => right.length - left.length)
      .reduce(
        (current, [translated, source]) =>
          current.replaceAll(translated, source),
        restored,
      );
  });

  const mixedTextFixes = {
    होम: "Home",
    सेवा: "services",
    "सोप्या पद्धतीने बुक करा": "booked clearly",
    "होम Service, सोप्या पद्धतीने बुक करा": "Home services, booked clearly",
    "होम services, सोप्या पद्धतीने बुक करा": "Home services, booked clearly",
    "होम सेवा, सोप्या पद्धतीने बुक करा": "Home services, booked clearly",
    "Home Service, booked clearly": "Home services, booked clearly",
  };

  restored = Object.entries(mixedTextFixes)
    .sort(([left], [right]) => right.length - left.length)
    .reduce(
      (current, [translated, source]) => current.replaceAll(translated, source),
      restored,
    );

  return `${leading}${restored}${trailing}`;
};

const translatePageText = (text, language) => {
  if (language === "en") return text;
  const dictionary = pageTextTranslations[language] || {};
  const leading = text.match(/^\s*/)?.[0] || "";
  const trailing = text.match(/\s*$/)?.[0] || "";
  const trimmed = text.trim();

  if (!trimmed || /^[\d\s.,:|₹$()-]+$/.test(trimmed) || /@/.test(trimmed))
    return text;
  if (dictionary[trimmed]) return `${leading}${dictionary[trimmed]}${trailing}`;

  const translated = Object.entries(dictionary)
    .sort(([left], [right]) => right.length - left.length)
    .reduce(
      (current, [source, target]) => current.replaceAll(source, target),
      trimmed,
    );

  return `${leading}${translated}${trailing}`;
};

const applyPageLanguage = (language) => {
  if (typeof document === "undefined") return;
  const ignoredTags = new Set([
    "SCRIPT",
    "STYLE",
    "TEXTAREA",
    "INPUT",
    "SELECT",
    "OPTION",
  ]);
  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: (node) => {
        const parent = node.parentElement;
        if (
          !parent ||
          ignoredTags.has(parent.tagName) ||
          parent.closest("[data-no-translate]")
        ) {
          return NodeFilter.FILTER_REJECT;
        }
        return node.nodeValue.trim()
          ? NodeFilter.FILTER_ACCEPT
          : NodeFilter.FILTER_REJECT;
      },
    },
  );

  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);

  nodes.forEach((node) => {
    if (!originalTextNodes.has(node))
      originalTextNodes.set(node, restoreEnglishText(node.nodeValue));
    const original = restoreEnglishText(originalTextNodes.get(node));
    node.nodeValue =
      language === "en" ? original : translatePageText(original, language);
  });
};

const categoryImages = {
  Plumber:
    "https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?auto=format&fit=crop&w=520&q=80",
  Electrician:
    "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=520&q=80",
  Carpenter:
    "https://images.unsplash.com/photo-1601058268499-e52658b8bb88?auto=format&fit=crop&w=520&q=80",
  Painter:
    "https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&w=520&q=80",
  Cleaning:
    "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=520&q=80",
  "AC Repair":
    "https://upload.wikimedia.org/wikipedia/commons/thumb/1/18/Wall_mount_air_conditioner.jpg/960px-Wall_mount_air_conditioner.jpg",
  "TV Repair":
    "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&w=520&q=80",
  "Refrigerator Repair":
    "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=520&q=80",
  "Washing Machine Repair":
    "https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&w=520&q=80",
};

const getTodayInputDate = () => new Date().toLocaleDateString("en-CA");

const serviceSearchCardMap = {
  "Refrigerator Repair": "Appliance Repair",
  "Washing Machine Repair": "Appliance Repair",
};

const getPopularServiceTitle = (category) =>
  serviceSearchCardMap[category] || category;

const getServiceSlug = (value) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const parseApiResponse = async (response, fallbackMessage) => {
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return response.json();
  }
  return { message: (await response.text()) || fallbackMessage };
};

const authInvalidEvent = "servicehub:auth-invalid";
const allowedSessionRoles = new Set(["user", "provider", "admin"]);

const clearStoredAuthSession = () => {
  localStorage.removeItem("servicehub_token");
  localStorage.removeItem("servicehub_user");
};

const isExpiredToken = (token) => {
  try {
    const payload = JSON.parse(atob(token.split(".")[1] || ""));
    return typeof payload.exp !== "number" || payload.exp * 1000 <= Date.now();
  } catch {
    return true;
  }
};

const authenticatedFetch = async (url, options = {}) => {
  const response = await fetch(url, options);
  if (response.status === 401) {
    clearStoredAuthSession();
    window.dispatchEvent(new Event(authInvalidEvent));
  }
  return response;
};

const getSavedUser = () => {
  try {
    const savedUser = localStorage.getItem("servicehub_user");
    if (!savedUser) return null;
    const parsedUser = JSON.parse(savedUser);
    if (
      !parsedUser ||
      typeof parsedUser !== "object" ||
      !allowedSessionRoles.has(parsedUser.role) ||
      !(parsedUser.id || parsedUser._id)
    ) {
      clearStoredAuthSession();
      return null;
    }
    return parsedUser;
  } catch {
    clearStoredAuthSession();
    return null;
  }
};

const contactReplyStorageKey = "servicehub_contact_replies";

const getSavedContactReplies = () => {
  try {
    return JSON.parse(localStorage.getItem(contactReplyStorageKey) || "{}");
  } catch {
    localStorage.removeItem(contactReplyStorageKey);
    return {};
  }
};

const mergeContactMessagesWithReplies = (messages = []) => {
  const replies = getSavedContactReplies();
  return messages.map((message) =>
    replies[message._id] ? { ...message, ...replies[message._id] } : message,
  );
};

const normalizeProvider = (provider) => ({
  id:
    provider._id ||
    provider.providerCode ||
    `${provider.name}-${provider.category}`,
  providerId: provider._id || "",
  name: provider.name,
  category: provider.category,
  location: provider.location,
  rating: provider.rating || 0,
  reviews: provider.reviews || 0,
  responseTime: provider.responseTime || "~1 hr",
  price: provider.price || "Contact for price",
  phone: provider.phone || "",
  email: provider.email || "",
  description:
    provider.description ||
    `${provider.name} provides ${provider.category} services in ${provider.location}.`,
  about: provider.about || provider.description,
  features: provider.features?.length ? provider.features : [provider.category],
  image:
    provider.profileImage ||
    categoryImages[provider.category] ||
    categoryImages.Cleaning,
});

const normalizeProviderDashboard = (data) => ({
  provider: data.provider || null,
  bookings: Array.isArray(data.bookings) ? data.bookings : [],
  availableRequests: Array.isArray(data.availableRequests)
    ? data.availableRequests
    : [],
  dashboardLocked: Boolean(data.dashboardLocked),
  message: data.message || "",
});

const formatBookingDate = (value) => {
  if (!value) return "Date not set";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
};

const formatBookingTime = (value) => {
  if (!value || !value.includes(":")) return value || "Time not set";
  const [hourValue, minuteValue] = value.split(":").map(Number);
  return `${hourValue % 12 || 12}:${String(minuteValue || 0).padStart(2, "0")} ${hourValue >= 12 ? "PM" : "AM"}`;
};

const clientCancelWindowMs = 10 * 60 * 1000;

const getClientCancelState = (booking, now = Date.now()) => {
  if (["completed", "cancelled", "rejected"].includes(booking.status)) {
    return { canCancel: false, label: "Cancel unavailable" };
  }

  if (!booking.acceptedAt) {
    return { canCancel: true, label: "Cancel booking" };
  }

  const acceptedAt = new Date(booking.acceptedAt).getTime();
  const remainingMs = clientCancelWindowMs - (now - acceptedAt);

  if (remainingMs <= 0) {
    return { canCancel: false, label: "Cancel time expired" };
  }

  const remainingMinutes = Math.ceil(remainingMs / 60000);
  return {
    canCancel: true,
    label: `Cancel booking (${remainingMinutes}m left)`,
  };
};

const formatRoleLabel = (role) => {
  if (role === "admin") return "Admin";
  if (role === "provider") return "Provider";
  return "Client";
};

const formatPrice = (value) =>
  Number.isFinite(Number(value))
    ? `Rs. ${Number(value).toLocaleString("en-IN")}`
    : "Price not set";

const formatMoney = (value) =>
  Number.isFinite(Number(value))
    ? `Rs. ${Number(value).toLocaleString("en-IN")}`
    : "Rs. 0";

const formatEstimateTimestamp = (value) => {
  if (!value) return "";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
};

const formatServiceChargeLabel = (price = "") => {
  const amount = String(price)
    .replace(/^from\s+/i, "")
    .trim();
  return amount ? `Service charge ${amount}` : "Service charge not set";
};

const parseMoneyValue = (value = "") => {
  const amount = String(value)
    .replace(/,/g, "")
    .match(/\d+(\.\d+)?/)?.[0];
  return Number.isFinite(Number(amount)) ? Number(amount) : 0;
};

const INITIAL_DASHBOARD_TIME = Date.now();
const parseDurationValue = (value = "1 hour") => {
  const normalized = String(value).toLowerCase();
  if (normalized.includes("half")) return { amount: "4", unit: "hours" };
  if (normalized.includes("full")) return { amount: "8", unit: "hours" };
  const amount = normalized.match(/\d+/)?.[0] || "1";
  const unit = normalized.includes("min")
    ? "min"
    : normalized.includes("day")
      ? "days"
      : "hours";
  return { amount, unit };
};

const buildDurationValue = (amount, unit) => {
  const cleanAmount =
    String(amount || "")
      .replace(/\D/g, "")
      .slice(0, 2) || "1";
  if (unit === "min") return `${cleanAmount} min`;
  if (unit === "days")
    return `${cleanAmount} ${cleanAmount === "1" ? "day" : "days"}`;
  return `${cleanAmount} ${cleanAmount === "1" ? "hour" : "hours"}`;
};
const blankProviderAccountForm = {
  name: "",
  category: "",
  location: "",
  phone: "",
  email: "",
  price: "",
  responseTime: "",
  description: "",
  about: "",
  features: "",
  bankDetails: {
    accountHolder: "",
    bankName: "",
    accountNumber: "",
    ifscCode: "",
  },
};

const providerToAccountForm = (provider = {}) => ({
  name: provider.name || "",
  category: provider.category || "",
  location: provider.location || "",
  phone: provider.phone || "",
  email: provider.email || "",
  price: provider.price || "",
  responseTime: provider.responseTime || "",
  description: provider.description || "",
  about: provider.about || "",
  features: Array.isArray(provider.features)
    ? provider.features.join(", ")
    : provider.features || "",
  bankDetails: {
    accountHolder: provider.bankDetails?.accountHolder || "",
    bankName: provider.bankDetails?.bankName || "",
    accountNumber: provider.bankDetails?.accountNumber || "",
    ifscCode: provider.bankDetails?.ifscCode || "",
  },
});

export default function Home() {
  const [theme, setTheme] = useState(
    () => localStorage.getItem("servicehub_theme") || "light",
  );
  const [language, setLanguage] = useState(getSavedLanguage);
  const [user, setUser] = useState(getSavedUser);
  const [authMode, setAuthMode] = useState(null);
  const [authRole, setAuthRole] = useState("user");
  const [authLocked, setAuthLocked] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [catalogProviders, setCatalogProviders] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [providerData, setProviderData] = useState(null);
  const [providerEarnings, setProviderEarnings] = useState(null);
  const [adminData, setAdminData] = useState(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [payingBookingId, setPayingBookingId] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [location, setLocation] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [activeView, setActiveView] = useState("home");
  const [activeSection, setActiveSection] = useState("top");
  const [navScrolled, setNavScrolled] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [loginMenuOpen, setLoginMenuOpen] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [profileImageOpen, setProfileImageOpen] = useState(false);
  const [providerAccountOpen, setProviderAccountOpen] = useState(false);
  const [providerAccountEditOpen, setProviderAccountEditOpen] = useState(false);
  useEffect(() => {
    const isProviderModalOpen = providerAccountOpen || providerAccountEditOpen;

    if (!isProviderModalOpen) return undefined;

    const previousOverflow = document.body.style.overflow;

    const handleEsc = (event) => {
      if (event.key === "Escape") {
        setProviderAccountOpen(false);
        setProviderAccountEditOpen(false);
      }
    };

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleEsc);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleEsc);
    };
  }, [providerAccountOpen, providerAccountEditOpen]);
  const [providerVisibleCount, setProviderVisibleCount] = useState(4);
  const [providerClientMode, setProviderClientMode] = useState(false);
  const [selectedProviders, setSelectedProviders] = useState({});
  const [bookingForm, setBookingForm] = useState({
    name: "",
    phone: "",
    service: "",
    address: "",
    problemDescription: "",
    date: "",
    time: "10:00",
    duration: "1 hour",
    providerId: "",
  });
  const [providerAccountForm, setProviderAccountForm] = useState(
    blankProviderAccountForm,
  );
  const accountMenuRef = useRef(null);
  const loginMenuRef = useRef(null);
  const moreMenuRef = useRef(null);

  const token = localStorage.getItem("servicehub_token");
  const isDark = theme === "dark";
  const t = useCallback(
    (key) => translations[language]?.[key] || translations.en[key] || key,
    [language],
  );

  const closeSessionUi = useCallback(({ closeAuth = true } = {}) => {
    setAccountMenuOpen(false);
    setLoginMenuOpen(false);
    setMoreMenuOpen(false);
    setMobileNavOpen(false);
    if (closeAuth) {
      setAuthMode(null);
      setAuthLocked(false);
    }
    setBookingOpen(false);
    setSelectedService(null);
    setProfileImageOpen(false);
    setProviderAccountOpen(false);
    setProviderAccountEditOpen(false);
  }, []);

  const clearSessionState = useCallback(
    ({ message = "", closeAuth = true } = {}) => {
      clearStoredAuthSession();
      closeSessionUi({ closeAuth });
      setUser(null);
      setBookings([]);
      setProviderData(null);
      setProviderEarnings(null);
      setAdminData(null);
      setSelectedProviders({});
      setProviderClientMode(false);
      setActiveView("home");
      if (message) setStatusMessage(message);
    },
    [closeSessionUi],
  );

  useEffect(() => {
    if (!statusMessage) return undefined;

    const timer = window.setTimeout(() => setStatusMessage(""), 4200);
    return () => window.clearTimeout(timer);
  }, [statusMessage]);

  useEffect(() => {
    let stopped = false;
    let storageSyncTimer;

    const syncAuthSession = async () => {
      const savedToken = localStorage.getItem("servicehub_token");
      const savedUser = getSavedUser();

      // Opening a native file picker temporarily blurs the browser. When it
      // closes, focus/visibility events run this sync again. An anonymous
      // visitor is a valid state, so keep an in-progress registration modal.
      if (!savedToken && !savedUser) {
        if (!stopped) clearSessionState({ closeAuth: false });
        return;
      }

      if (!savedToken || !savedUser || isExpiredToken(savedToken)) {
        if (!stopped) clearSessionState();
        return;
      }

      setUser(savedUser);

      try {
        const response = await authenticatedFetch(`${API_URL}/auth/profile`, {
          headers: { Authorization: `Bearer ${savedToken}` },
        });
        if (!response.ok || stopped) return;
        const data = await response.json();
        const verifiedUser = data.user;
        if (
          !verifiedUser ||
          !allowedSessionRoles.has(verifiedUser.role) ||
          !(verifiedUser.id || verifiedUser._id)
        ) {
          clearSessionState({
            message: "Your session data was invalid. Please log in again.",
          });
          return;
        }
        localStorage.setItem("servicehub_user", JSON.stringify(verifiedUser));
        setUser(verifiedUser);
        setActiveView((currentView) => {
          const allowedViews = {
            user: new Set(["home", "client"]),
            provider: new Set(["home", "client", "provider"]),
            admin: new Set(["admin"]),
          };
          if (allowedViews[verifiedUser.role]?.has(currentView))
            return currentView;
          return verifiedUser.role === "provider"
            ? "provider"
            : verifiedUser.role === "admin"
              ? "admin"
              : "client";
        });
      } catch {
        // Keep a locally valid session during temporary network outages.
      }
    };

    const handleVisibilityChange = () => {
      if (!document.hidden) syncAuthSession();
    };
    const handleStorageChange = (event) => {
      if (
        event.key &&
        !["servicehub_token", "servicehub_user"].includes(event.key)
      )
        return;
      window.clearTimeout(storageSyncTimer);
      storageSyncTimer = window.setTimeout(syncAuthSession, 25);
    };
    const handleInvalidSession = () =>
      clearSessionState({
        message: "Your session expired. Please log in again.",
      });

    syncAuthSession();
    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("focus", syncAuthSession);
    window.addEventListener(authInvalidEvent, handleInvalidSession);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      stopped = true;
      window.clearTimeout(storageSyncTimer);
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("focus", syncAuthSession);
      window.removeEventListener(authInvalidEvent, handleInvalidSession);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [clearSessionState]);

  useEffect(() => {
    const closeMoreMenu = (event) => {
      if (
        moreMenuRef.current?.contains(event.target) ||
        loginMenuRef.current?.contains(event.target) ||
        accountMenuRef.current?.contains(event.target)
      )
        return;
      setAccountMenuOpen(false);
      setLoginMenuOpen(false);
      setMoreMenuOpen(false);
    };

    document.addEventListener("mousedown", closeMoreMenu);
    return () => document.removeEventListener("mousedown", closeMoreMenu);
  }, []);

  const openClientAuth = (mode = "login", locked = mode !== "login") => {
    setAuthRole("user");
    setAuthLocked(locked);
    setAuthMode(mode);
  };

  const openProviderAuth = (mode = "register") => {
    if (user?.role === "user") {
      setAuthMode(null);
      setMobileNavOpen(false);
      setStatusMessage(
        "Please logout from your client account before becoming a provider.",
      );
      return;
    }

    setAuthRole("provider");
    setAuthLocked(true);
    setAuthMode(mode);
  };

  useEffect(() => {
    localStorage.setItem("servicehub_theme", theme);
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  useEffect(() => {
    localStorage.setItem("servicehub_language", language);
    document.documentElement.lang = language;
  }, [language]);

  useEffect(() => {
    const firstTimer = window.setTimeout(() => applyPageLanguage(language), 0);
    const secondTimer = window.setTimeout(
      () => applyPageLanguage(language),
      80,
    );
    return () => {
      window.clearTimeout(firstTimer);
      window.clearTimeout(secondTimer);
    };
  }, [
    language,
    activeView,
    mobileNavOpen,
    authMode,
    bookings,
    providerData,
    adminData,
  ]);

  useEffect(() => {
    const timer = window.setTimeout(
      () => document.querySelector("#top")?.scrollIntoView({ block: "start" }),
      0,
    );
    return () => window.clearTimeout(timer);
  }, []);

  const refreshCatalogProviders = useCallback(async () => {
    fetchCatalogSnapshot()
      .then((data) =>
        setCatalogProviders((data.providers || []).map(normalizeProvider)),
      )
      .catch(() => setCatalogProviders([]));
  }, []);

  useEffect(() => {
    refreshCatalogProviders();
  }, [refreshCatalogProviders]);

  const refreshClientBookings = useCallback(async () => {
    const currentToken = localStorage.getItem("servicehub_token");
    if (!currentToken) return;

    try {
      const response = await authenticatedFetch(`${API_URL}/bookings/my`, {
        headers: { Authorization: `Bearer ${currentToken}` },
      });
      const data = response.ok ? await response.json() : { bookings: [] };
      setBookings(data.bookings || []);
    } catch {
      setBookings([]);
    }
  }, []);

  useEffect(() => {
    const shouldRefreshClient =
      Boolean(token) &&
      activeView === "client" &&
      (user?.role === "user" ||
        (user?.role === "provider" && providerClientMode));
    if (!shouldRefreshClient) return undefined;

    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") refreshClientBookings();
    };

    const initialTimer = window.setTimeout(refreshClientBookings, 0);
    const intervalId = window.setInterval(refreshWhenVisible, 15_000);
    document.addEventListener("visibilitychange", refreshWhenVisible);
    return () => {
      window.clearTimeout(initialTimer);
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, [
    activeView,
    providerClientMode,
    refreshClientBookings,
    user?.role,
    token,
  ]);

  const marketplaceServices = useMemo(() => {
    const map = new Map();
    catalogProviders.forEach((provider) =>
      map.set(`${provider.name}-${provider.category}`, provider),
    );
    return [...map.values()];
  }, [catalogProviders]);

  const categories = useMemo(
    () => [
      "All",
      ...new Set(marketplaceServices.map((service) => service.category)),
    ],
    [marketplaceServices],
  );

  const filteredServices = marketplaceServices.filter((service) => {
    const serviceQuery = searchTerm.trim().toLowerCase();
    const locationQuery = location.trim().toLowerCase();

    const serviceHaystack = [
      service.name,
      service.category,
      service.description,
      service.price,
    ]
      .join(" ")
      .toLowerCase();

    const locationHaystack = [
      service.location,
      service.city,
      service.area,
      service.serviceArea,
      service.address,
    ]
      .join(" ")
      .toLowerCase();

    const categoryMatch =
      selectedCategory === "All" || service.category === selectedCategory;

    const serviceMatch =
      !serviceQuery || serviceHaystack.includes(serviceQuery);

    const locationMatch =
      !locationQuery || locationHaystack.includes(locationQuery);

    return categoryMatch && serviceMatch && locationMatch;
  });

  const providerProfile = providerData?.provider;
  const isWaitingForApproval =
    Boolean(providerProfile) && providerProfile.approvalStatus !== "approved";
  const providerRequests = providerData?.availableRequests || [];
  const providerBookings = providerData?.bookings || [];
  const providerDashboardNavLabel =
    activeView === "client" && user?.role === "provider"
      ? t("clientDashboard")
      : t("providerDashboard");
  const mainNavItems = [
    { id: "top", label: t("home"), icon: House },
    { id: "services", label: t("services"), icon: BriefcaseBusiness },
    { id: "providers", label: t("providers"), icon: MapPin },
    { id: "contact", label: t("contactUs"), icon: MessageCircle },
  ];
  const isNavActive = (id) =>
    activeView === "home"
      ? activeSection === id
      : id === "top" && user?.role === "provider" && activeView === "provider";

  useEffect(() => {
    const handleScroll = () => {
      setNavScrolled(window.scrollY > 12);
      const sections = ["top", "services", "providers", "contact"];
      const current = sections.findLast((id) => {
        const element = document.getElementById(id);
        return element && element.getBoundingClientRect().top <= 140;
      });
      if (current) setActiveSection(current);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navigateHome = (hash = "") => {
    if (user?.role === "admin") {
      setActiveView("admin");
      setMobileNavOpen(false);
      return;
    }
    setActiveView("home");
    setMobileNavOpen(false);
    window.setTimeout(() => {
      if (hash)
        document
          .querySelector(hash)
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
  };

  const handleHomeNav = () => {
    if (user?.role === "provider" && !providerClientMode) {
      loadProviderDashboard();
      return;
    }

    navigateHome("#top");
  };

  const goMainHome = () => {
    navigateHome("#top");
  };

  const loadProviderDashboard = useCallback(async () => {
    if (user?.role !== "provider") {
      setStatusMessage("Provider access required.");
      return;
    }
    const currentToken = localStorage.getItem("servicehub_token");
    if (!currentToken) return;
    try {
      setProviderClientMode(false);
      const response = await authenticatedFetch(
        `${API_URL}/providers/dashboard`,
        {
          headers: { Authorization: `Bearer ${currentToken}` },
        },
      );
      const data = await parseApiResponse(
        response,
        "Provider dashboard could not be loaded.",
      );
      if (!response.ok)
        throw new Error(
          data.message || "Provider dashboard could not be loaded.",
        );
      const nextProviderDashboard = normalizeProviderDashboard(data);
      setProviderData(nextProviderDashboard);
      if (
        !nextProviderDashboard.dashboardLocked &&
        nextProviderDashboard.provider?.approvalStatus === "approved"
      ) {
        getProviderEarnings()
          .then(setProviderEarnings)
          .catch(() => setProviderEarnings(null));
      } else {
        setProviderEarnings(null);
      }
      setActiveView("provider");
    } catch (error) {
      try {
        const profileResponse = await authenticatedFetch(
          `${API_URL}/providers/profile`,
          {
            headers: { Authorization: `Bearer ${currentToken}` },
          },
        );
        const profileData = await parseApiResponse(
          profileResponse,
          "Provider profile could not be loaded.",
        );
        if (
          profileResponse.ok &&
          profileData.provider?.approvalStatus !== "approved"
        ) {
          setProviderData({
            provider: profileData.provider,
            bookings: [],
            availableRequests: [],
            dashboardLocked: true,
            message:
              profileData.provider.approvalStatus === "rejected"
                ? "Provider profile was not approved by admin."
                : "Provider profile is waiting for admin approval.",
          });
          setProviderEarnings(null);
        }
      } catch {
        setProviderData((current) => ({
          ...normalizeProviderDashboard(current || {}),
          dashboardLocked: true,
          message: "Provider profile is waiting for admin approval.",
        }));
        setProviderEarnings(null);
      }
      setStatusMessage(error.message);
      setActiveView("provider");
    }
  }, [user]);

  useEffect(() => {
    if (
      user?.role !== "provider" ||
      activeView !== "provider" ||
      providerData ||
      !token
    )
      return;
    loadProviderDashboard();
  }, [activeView, loadProviderDashboard, providerData, token, user?.role]);

  const openProviderClientDashboard = () => {
    if (user?.role !== "provider") {
      setStatusMessage("Provider access required.");
      return;
    }
    setProviderClientMode(true);
    setActiveView("client");
    setMobileNavOpen(false);
  };

  const browseServicesAsClient = () => {
    if (user?.role === "provider") setProviderClientMode(true);
    navigateHome("#services");
  };

  useEffect(() => {
    if (activeView !== "provider" || user?.role !== "provider")
      return undefined;

    if (!isWaitingForApproval) return undefined;

    const intervalId = window.setInterval(loadProviderDashboard, 10000);
    return () => window.clearInterval(intervalId);
  }, [
    activeView,
    isWaitingForApproval,
    loadProviderDashboard,
    providerProfile?.approvalStatus,
    user?.role,
    token,
  ]);

  const openProviderAccount = async () => {
    const currentToken = localStorage.getItem("servicehub_token");
    if (!currentToken) return;
    try {
      const response = await authenticatedFetch(
        `${API_URL}/providers/profile`,
        {
          headers: { Authorization: `Bearer ${currentToken}` },
        },
      );
      const data = await parseApiResponse(
        response,
        "Provider profile could not be loaded.",
      );
      if (!response.ok)
        throw new Error(
          data.message || "Provider profile could not be loaded.",
        );
      setProviderAccountForm(providerToAccountForm(data.provider));
      setProviderData((current) => ({
        ...normalizeProviderDashboard(current || {}),
        provider: data.provider,
      }));
      setProviderAccountOpen(true);
      setProviderAccountEditOpen(false);
      setMobileNavOpen(false);
    } catch (error) {
      setStatusMessage(error.message);
    }
  };

  const submitProviderAccount = async (event) => {
    event.preventDefault();
    try {
      const response = await authenticatedFetch(
        `${API_URL}/providers/profile`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(providerAccountForm),
        },
      );
      const data = await parseApiResponse(
        response,
        "Provider profile could not be updated.",
      );
      if (!response.ok)
        throw new Error(
          data.message || "Provider profile could not be updated.",
        );

      setProviderData((current) => ({
        ...normalizeProviderDashboard(current || {}),
        provider: data.provider,
      }));
      setCatalogProviders((current) =>
        current.map((provider) =>
          provider.providerId === data.provider._id ||
          provider.id === data.provider._id
            ? normalizeProvider(data.provider)
            : provider,
        ),
      );
      const updatedUser = {
        ...user,
        name: data.provider.name,
        email: data.provider.email,
        phone: data.provider.phone,
      };
      setUser(updatedUser);
      localStorage.setItem("servicehub_user", JSON.stringify(updatedUser));
      setProviderAccountForm(providerToAccountForm(data.provider));
      setProviderAccountOpen(false);
      setProviderAccountEditOpen(false);
      setActiveView("home");
      window.setTimeout(
        () =>
          document
            .querySelector("#top")
            ?.scrollIntoView({ behavior: "smooth", block: "start" }),
        0,
      );
      setStatusMessage("Provider profile updated successfully.");
      refreshCatalogProviders();
    } catch (error) {
      setStatusMessage(error.message);
    }
  };

  const loadAdminDashboard = useCallback(async () => {
    try {
      if (user?.role !== "admin") throw new Error("Admin access required.");
      const currentToken = localStorage.getItem("servicehub_token");
      if (!currentToken)
        throw new Error("Please log in as admin to open the admin panel.");
      const authHeaders = { Authorization: `Bearer ${currentToken}` };
      const response = await authenticatedFetch(`${API_URL}/admin/dashboard`, {
        headers: authHeaders,
      });
      const data = await parseApiResponse(
        response,
        "Admin dashboard could not be loaded.",
      );
      if (!response.ok)
        throw new Error(data.message || "Admin dashboard could not be loaded.");

      setAdminData({
        ...data,
        contactMessages: mergeContactMessagesWithReplies(
          data.contactMessages || [],
        ),
      });
      setActiveView("admin");
    } catch (error) {
      setStatusMessage(error.message);
    }
  }, [user]);

  useEffect(() => {
    if (activeView !== "admin" || user?.role !== "admin" || adminData?.stats)
      return;
    const timer = window.setTimeout(loadAdminDashboard, 0);
    return () => window.clearTimeout(timer);
  }, [activeView, adminData?.stats, loadAdminDashboard, user?.role]);

  const refreshAdminContactMessages = async ({ silent = false } = {}) => {
    const currentToken = localStorage.getItem("servicehub_token");
    if (!currentToken) return;

    try {
      const response = await authenticatedFetch(
        `${API_URL}/admin/contact-messages`,
        {
          headers: { Authorization: `Bearer ${currentToken}` },
        },
      );
      const data = await parseApiResponse(
        response,
        "Client messages could not be loaded.",
      );
      if (!response.ok)
        throw new Error(data.message || "Client messages could not be loaded.");

      setAdminData((current) => {
        const nextMessages = {
          contactMessages: mergeContactMessagesWithReplies(
            data.contactMessages || [],
          ),
        };
        return current ? { ...current, ...nextMessages } : nextMessages;
      });
      if (!silent) setStatusMessage("Client messages refreshed.");
    } catch (error) {
      if (!silent) setStatusMessage(error.message);
    }
  };

  useEffect(() => {
    if (activeView !== "admin") return undefined;

    const initialRefresh = window.setTimeout(
      () => refreshAdminContactMessages({ silent: true }),
      0,
    );
    const timer = window.setInterval(
      () => refreshAdminContactMessages({ silent: true }),
      30000,
    );
    return () => {
      window.clearTimeout(initialRefresh);
      window.clearInterval(timer);
    };
  }, [activeView]);

  const refreshAfterAction = ({
    client = false,
    provider = false,
    admin = false,
  } = {}) => {
    if (client) refreshClientBookings();
    if (provider) loadProviderDashboard();
    if (admin) loadAdminDashboard();

    window.setTimeout(() => {
      if (client) refreshClientBookings();
      if (provider) loadProviderDashboard();
    }, 900);
  };

  const handleLogout = () => {
    const roleLabel = formatRoleLabel(user?.role);
    const currentToken = localStorage.getItem("servicehub_token");
    if (currentToken) {
      fetch(`${API_URL}/auth/logout`, {
        method: "POST",
        headers: { Authorization: `Bearer ${currentToken}` },
        keepalive: true,
      }).catch(() => {});
    }
    clearSessionState({ message: `${roleLabel} logged out successfully.` });
  };

  const openBooking = (service) => {
    if (!user) {
      setSelectedService(null);
      setBookingOpen(false);
      openClientAuth("login");
      return;
    }

    if (user?.role === "admin") {
      setSelectedService(null);
      setBookingOpen(false);
      setStatusMessage(
        "Admin accounts cannot book services. Please use a client account.",
      );
      return;
    }

    const isOwnProviderProfile =
      user?.role === "provider" &&
      service.providerId &&
      providerProfile?._id &&
      String(service.providerId) === String(providerProfile._id);

    if (isOwnProviderProfile) {
      setSelectedService(null);
      setBookingOpen(false);
      setStatusMessage(
        "You cannot book your own provider service. Please choose another provider.",
      );
      return;
    }

    if (user?.role === "provider" && !providerClientMode) {
      setProviderClientMode(true);
    }

    setSelectedService(null);
    setBookingForm((current) => ({
      ...current,
      name: current.name || user?.name || "",
      phone: current.phone || user?.phone || "",
      service: service.category || service.name,
      providerId: service.providerId || "",
    }));
    setBookingOpen(true);
  };

  const updateProfileImage = async (profileImage) => {
    try {
      const currentToken = localStorage.getItem("servicehub_token");
      if (!currentToken)
        throw new Error("Please log in to update your profile image.");

      const response = await authenticatedFetch(
        `${API_URL}/auth/profile-image`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${currentToken}`,
          },
          body: JSON.stringify({ profileImage }),
        },
      );
      const data = await parseApiResponse(
        response,
        "Profile image could not be updated.",
      );
      if (!response.ok)
        throw new Error(data.message || "Profile image could not be updated.");

      const updatedUser = data.user || { ...user, profileImage };
      setUser(updatedUser);
      localStorage.setItem("servicehub_user", JSON.stringify(updatedUser));
      setProviderData((current) => {
        if (!current?.provider) return current;
        return {
          ...current,
          provider: {
            ...current.provider,
            profileImage,
          },
        };
      });
      setProfileImageOpen(false);
      setStatusMessage(data.message || "Profile image updated successfully.");
      refreshCatalogProviders();
    } catch (error) {
      setStatusMessage(error.message);
    }
  };

  const openProfileMenu = () => {
    if (user?.role === "provider") {
      openProviderAccount();
      return;
    }
    setProfileImageOpen(true);
  };

  const updateUserProfile = async (profile) => {
    const currentToken = localStorage.getItem("servicehub_token");
    if (!currentToken) throw new Error("Please log in to update your profile.");

    let response;
    let data;
    let lastNetworkError;
    const profilePaths = ["/auth/profile", "/auth/me"];
    for (const apiUrl of AUTH_API_URLS) {
      for (const path of profilePaths) {
        try {
          response = await authenticatedFetch(`${apiUrl}${path}`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${currentToken}`,
            },
            body: JSON.stringify(profile),
          });
          data = await parseApiResponse(
            response,
            "Profile could not be updated.",
          );
        } catch (error) {
          lastNetworkError = error;
          response = undefined;
          data = undefined;
          continue;
        }
        if (
          response &&
          (response.ok ||
            (response.status !== 404 &&
              data.message !== "API route not found."))
        )
          break;
      }
      if (
        response &&
        (response.ok ||
          (response.status !== 404 && data.message !== "API route not found."))
      )
        break;
    }
    if (!response) {
      throw new Error(
        lastNetworkError?.message === "Failed to fetch"
          ? "Backend is not reachable. Start or restart the backend server and try again."
          : lastNetworkError?.message || "Profile could not be updated.",
      );
    }
    if (!response.ok)
      throw new Error(data.message || "Profile could not be updated.");

    const updatedUser = data.user || { ...user, ...profile };
    setUser(updatedUser);
    localStorage.setItem("servicehub_user", JSON.stringify(updatedUser));
    setBookingForm((current) => ({
      ...current,
      name: current.name || updatedUser.name || "",
      phone: current.phone || updatedUser.phone || "",
    }));
    setStatusMessage(data.message || "Profile updated successfully.");
    refreshAfterAction({ client: true });
    return updatedUser;
  };

  const openPopularService = (serviceTitle) => {
    const categoryMap = {
      "Appliance Repair": "Refrigerator Repair",
    };
    const category = categoryMap[serviceTitle] || serviceTitle;
    setSelectedCategory(category);
    setProviderVisibleCount(4);
    window.setTimeout(
      () =>
        document
          .querySelector("#providers")
          ?.scrollIntoView({ behavior: "smooth", block: "start" }),
      0,
    );
  };

  const searchServices = () => {
    const query = searchTerm.trim().toLowerCase();

    if (!query) {
      setSelectedCategory("All");
      document
        .querySelector("#services")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    const exactCategory = categories.find(
      (category) => category !== "All" && category.toLowerCase() === query,
    );
    const matchedService = marketplaceServices.find((service) => {
      const searchableText = [
        service.name,
        service.category,
        service.location,
        service.description,
        service.price,
      ]
        .join(" ")
        .toLowerCase();
      return searchableText.includes(query);
    });

    const nextCategory = exactCategory || matchedService?.category;

    if (!nextCategory) {
      setSelectedCategory("All");
      setStatusMessage(
        "No matching service found. Try plumber, electrician, cleaning, or AC repair.",
      );
      document
        .querySelector("#services")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    setSelectedCategory(nextCategory);
    setProviderVisibleCount(4);
    window.setTimeout(() => {
      const serviceCard = document.querySelector(
        `[data-popular-service="${getServiceSlug(getPopularServiceTitle(nextCategory))}"]`,
      );
      (serviceCard || document.querySelector("#services"))?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 80);
  };

  const submitBooking = async (event) => {
    event.preventDefault();
    if (user?.role === "admin") {
      setBookingOpen(false);
      setStatusMessage("Admin accounts cannot book services.");
      return;
    }
    if (user?.role === "provider" && !providerClientMode) {
      setBookingOpen(false);
      setStatusMessage(
        "Open Client Booking Dashboard first to book a service from your provider account.",
      );
      return;
    }

    if (!token) {
      openClientAuth("login");
      setStatusMessage("Please login before booking a service.");
      return;
    }

    if (bookingForm.date && bookingForm.date < getTodayInputDate()) {
      setStatusMessage("Please choose today's date or a future date.");
      return;
    }

    try {
      const response = await authenticatedFetch(`${API_URL}/bookings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(bookingForm),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Booking failed.");
      setBookings((current) => [data.booking, ...current]);
      setBookingForm({
        name: "",
        phone: "",
        service: "",
        address: "",
        problemDescription: "",
        date: "",
        time: "10:00",
        duration: "1 hour",
        providerId: "",
        clientLatitude: "",
        clientLongitude: "",
        clientLocationAccuracy: "",
      });
      setBookingOpen(false);
      setSelectedService(null);
      setActiveView("client");
      setStatusMessage(
        "Booking saved. Your service address has been shared with the provider.",
      );
      refreshAfterAction({ client: true });
    } catch (error) {
      setStatusMessage(error.message);
    }
  };

  const acceptProviderRequest = async (bookingId) => {
    try {
      const response = await authenticatedFetch(
        `${API_URL}/providers/bookings/${bookingId}/accept`,
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const data = await parseApiResponse(
        response,
        "Booking request could not be accepted.",
      );
      if (!response.ok)
        throw new Error(
          data.message || "Booking request could not be accepted.",
        );
      setProviderData((current) => ({
        ...normalizeProviderDashboard(current || {}),
        availableRequests: (current?.availableRequests || []).filter(
          (booking) => booking._id !== bookingId,
        ),
        bookings: [data.booking, ...(current?.bookings || [])],
      }));
      setStatusMessage("Request accepted. The client has been notified.");
      refreshAfterAction({ provider: true });
    } catch (error) {
      setStatusMessage(error.message);
    }
  };

  const rejectProviderRequest = async (bookingId, reason = "") => {
    try {
      const response = await authenticatedFetch(
        `${API_URL}/providers/bookings/${bookingId}/reject`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ reason }),
        },
      );
      const data = await parseApiResponse(
        response,
        "Booking request could not be rejected.",
      );
      if (!response.ok)
        throw new Error(
          data.message || "Booking request could not be rejected.",
        );
      setProviderData((current) => ({
        ...normalizeProviderDashboard(current || {}),
        availableRequests: (current?.availableRequests || []).filter(
          (booking) => booking._id !== bookingId,
        ),
      }));
      setStatusMessage("Request rejected.");
      refreshAfterAction({ provider: true });
      return data.booking || true;
    } catch (error) {
      setStatusMessage(error.message);
      return false;
    }
  };

  const updateProviderBookingStatus = async (
    bookingId,
    status,
    cancellationReason = "",
  ) => {
    try {
      const response = await authenticatedFetch(
        `${API_URL}/providers/bookings/${bookingId}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status, cancellationReason }),
        },
      );
      const data = await parseApiResponse(
        response,
        "Booking status could not be updated.",
      );
      if (!response.ok)
        throw new Error(data.message || "Booking status could not be updated.");
      setProviderData((current) => ({
        ...normalizeProviderDashboard(current || {}),
        bookings: (current?.bookings || []).map((booking) =>
          booking._id === bookingId ? data.booking : booking,
        ),
      }));
      setStatusMessage(
        status === "completed"
          ? "Booking marked work completed."
          : `Booking marked ${status}.`,
      );
      refreshAfterAction({ provider: true });
      return data.booking;
    } catch (error) {
      setStatusMessage(error.message);
      return false;
    }
  };

  const updateClientBooking = (updatedBooking) => {
    setBookings((current) =>
      current.map((booking) =>
        booking._id === updatedBooking._id
          ? {
              ...booking,
              ...updatedBooking,
              assignedProvider:
                updatedBooking.assignedProvider || booking.assignedProvider,
              requestedProvider:
                updatedBooking.requestedProvider || booking.requestedProvider,
            }
          : booking,
      ),
    );
  };

  const updateProviderBooking = (updatedBooking) => {
    setProviderData((current) => ({
      ...normalizeProviderDashboard(current || {}),
      bookings: (current?.bookings || []).map((booking) =>
        booking._id === updatedBooking._id ? updatedBooking : booking,
      ),
    }));
  };

  const handleSubmitProviderEstimate = async (
    bookingId,
    finalEstimateAmount,
  ) => {
    const data = await submitProviderEstimate(bookingId, finalEstimateAmount);
    updateProviderBooking(data.booking);
    setStatusMessage("Estimate sent. Waiting for client response.");
    refreshAfterAction({ provider: true });
    return data.booking;
  };

  const handleAcceptEstimate = async (bookingId) => {
    try {
      const data = await acceptEstimate(bookingId);
      updateClientBooking(data.booking);
      setStatusMessage("Estimate accepted. Please complete payment.");
      refreshAfterAction({ client: true });
    } catch (error) {
      setStatusMessage(error.message);
    }
  };

  const handleRejectEstimate = async (bookingId, rejectionReason) => {
    const data = await rejectEstimate(bookingId, rejectionReason);
    updateClientBooking(data.booking);
    setStatusMessage("Estimate rejected. Rs. 200 penalty applied.");
    refreshAfterAction({ client: true });
    return data.booking;
  };

  const handlePayNow = async (booking) => {
    if (payingBookingId) return;

    setPayingBookingId(booking._id);
    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error(
          "Razorpay checkout could not be loaded. Please check your connection.",
        );
      }

      const orderResponse = await createRazorpayOrder(booking._id);
      if (orderResponse.booking) updateClientBooking(orderResponse.booking);
      refreshAfterAction({ client: true });

      const options = {
        key: orderResponse.key || import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: orderResponse.order.amount,
        currency: "INR",
        name: "ServiceHub",
        description: `Payment for ${booking.service}`,
        order_id: orderResponse.order.id,
        handler: async function handleRazorpaySuccess(response) {
          try {
            const verifyResponse = await verifyRazorpayPayment(
              response,
              booking._id,
            );
            updateClientBooking(verifyResponse.booking);
            setStatusMessage("Payment verified successfully.");
            refreshAfterAction({ client: true });
          } catch (error) {
            setStatusMessage(error.message);
          } finally {
            setPayingBookingId("");
          }
        },
        prefill: {
          name: booking.userName || "",
          email: booking.userEmail || "",
          contact: booking.phone || "",
        },
        method: {
          upi: true,
          card: true,
          netbanking: true,
          wallet: true,
          emi: false,
          paylater: false,
        },
        theme: {
          color: "#0f766e",
        },
        modal: {
          ondismiss: () => setPayingBookingId(""),
        },
      };

      const razorpayCheckout = new window.Razorpay(options);
      razorpayCheckout.on("payment.failed", (response) => {
        setPayingBookingId("");
        setStatusMessage(
          response.error?.description || "Payment failed. Please try again.",
        );
      });
      razorpayCheckout.open();
    } catch (error) {
      setPayingBookingId("");
      setStatusMessage(error.message);
    }
  };

  const updateProviderApproval = async (
    providerId,
    approvalStatus,
    rejectionReason = "",
  ) => {
    try {
      const response = await authenticatedFetch(
        `${API_URL}/admin/providers/${providerId}/approval`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ approvalStatus, rejectionReason }),
        },
      );
      const data = await parseApiResponse(
        response,
        "Provider approval failed.",
      );
      if (!response.ok)
        throw new Error(data.message || "Provider approval failed.");
      setAdminData((current) => ({
        ...current,
        providers: current.providers.map((provider) =>
          provider._id === providerId
            ? { ...provider, ...data.provider, documents: provider.documents }
            : provider,
        ),
      }));
      setStatusMessage(`Provider ${approvalStatus}.`);
      refreshCatalogProviders();
      refreshAfterAction({ admin: true });
    } catch (error) {
      setStatusMessage(error.message);
    }
  };

  const updateBookingRequest = async (bookingId, payload) => {
    try {
      const response = await authenticatedFetch(
        `${API_URL}/admin/bookings/${bookingId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        },
      );
      const data = await parseApiResponse(response, "Booking update failed.");
      if (!response.ok)
        throw new Error(data.message || "Booking update failed.");
      setAdminData((current) => ({
        ...current,
        bookings: current.bookings.map((booking) =>
          booking._id === bookingId ? data.booking : booking,
        ),
      }));
      setStatusMessage("Booking updated.");
      refreshAfterAction({ admin: true });
    } catch (error) {
      setStatusMessage(error.message);
    }
  };

  const cancelClientBooking = async (bookingId) => {
    try {
      const response = await authenticatedFetch(
        `${API_URL}/bookings/${bookingId}/cancel`,
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const data = await parseApiResponse(
        response,
        "Booking could not be cancelled.",
      );
      if (!response.ok)
        throw new Error(data.message || "Booking could not be cancelled.");
      setBookings((current) =>
        current.map((booking) =>
          booking._id === bookingId
            ? {
                ...booking,
                ...data.booking,
                assignedProvider:
                  data.booking.assignedProvider || booking.assignedProvider,
                requestedProvider:
                  data.booking.requestedProvider || booking.requestedProvider,
              }
            : booking,
        ),
      );
      setStatusMessage("Booking cancelled successfully.");
      refreshAfterAction({ client: true });
      return data.booking;
    } catch (error) {
      setStatusMessage(error.message);
      return null;
    }
  };

  const submitClientReview = async (bookingId, payload) => {
    try {
      const response = await authenticatedFetch(
        `${API_URL}/bookings/${bookingId}/review`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        },
      );
      const data = await parseApiResponse(
        response,
        "Review could not be submitted.",
      );
      if (!response.ok)
        throw new Error(data.message || "Review could not be submitted.");
      updateClientBooking(data.booking);
      setStatusMessage("Review submitted successfully.");
      refreshAfterAction({ client: true });
      return data.booking;
    } catch (error) {
      setStatusMessage(error.message);
      return null;
    }
  };

  return (
    <div className={isDark ? "dark" : ""}>
      <SEO
        title="ServiceHub India | Best Home Services and Local Service Booking Platform"
        description="Book verified electricians, plumbers, AC repair, cleaners, painters, carpenters, and appliance repair providers on ServiceHub India, a trusted local service marketplace."
        keywords={targetKeywords}
        path="/"
        schema={[
          organizationSchema,
          localBusinessSchema,
          faqSchema,
          reviewSchema,
          ...serviceSchema,
          buildBreadcrumbSchema([{ name: "Home", path: "/" }]),
        ]}
      />
      <div className="min-h-screen bg-slate-50 text-slate-950 transition-colors duration-500 dark:bg-[#081229] dark:text-white">
        {activeView === "home" && (
          <ModernNavbar
            navScrolled={navScrolled}
            SERVICEHUB_ICON={SERVICEHUB_ICON}
            user={user}
            activeView={activeView}
            providerDashboardNavLabel={providerDashboardNavLabel || "Workspace"}
            language={language}
            supportedLanguages={
              supportedLanguages || [
                { code: "en", label: "English", short: "EN" },
                { code: "hi", label: "हिंदी", short: "HI" },
                { code: "mr", label: "मराठी", short: "MR" },
              ]
            }
            isDark={isDark}
            mainNavItems={mainNavItems || []}
            accountMenuOpen={accountMenuOpen}
            loginMenuOpen={loginMenuOpen}
            moreMenuOpen={moreMenuOpen}
            mobileNavOpen={mobileNavOpen}
            accountMenuRef={accountMenuRef}
            loginMenuRef={loginMenuRef}
            moreMenuRef={moreMenuRef}
            t={t || ((key) => key)}
            setTheme={typeof setTheme === "function" ? setTheme : () => {}}
            setLanguage={
              typeof setLanguage === "function" ? setLanguage : () => {}
            }
            setActiveView={
              typeof setActiveView === "function" ? setActiveView : () => {}
            }
            setAccountMenuOpen={
              typeof setAccountMenuOpen === "function"
                ? setAccountMenuOpen
                : () => {}
            }
            setLoginMenuOpen={
              typeof setLoginMenuOpen === "function"
                ? setLoginMenuOpen
                : () => {}
            }
            setMoreMenuOpen={
              typeof setMoreMenuOpen === "function" ? setMoreMenuOpen : () => {}
            }
            setMobileNavOpen={
              typeof setMobileNavOpen === "function"
                ? setMobileNavOpen
                : () => {}
            }
            navigateHome={
              typeof navigateHome === "function" ? navigateHome : () => {}
            }
            goMainHome={
              typeof goMainHome === "function"
                ? goMainHome
                : typeof handleHomeNav === "function"
                  ? handleHomeNav
                  : () => {}
            }
            handleHomeNav={
              typeof handleHomeNav === "function" ? handleHomeNav : () => {}
            }
            isNavActive={
              typeof isNavActive === "function" ? isNavActive : () => false
            }
            openClientAuth={
              typeof openClientAuth === "function" ? openClientAuth : () => {}
            }
            openProviderAuth={
              typeof openProviderAuth === "function"
                ? openProviderAuth
                : () => {}
            }
            openProfileMenu={
              typeof openProfileMenu === "function" ? openProfileMenu : () => {}
            }
            loadProviderDashboard={
              typeof loadProviderDashboard === "function"
                ? loadProviderDashboard
                : () => {}
            }
            loadAdminDashboard={
              typeof loadAdminDashboard === "function"
                ? loadAdminDashboard
                : () => {}
            }
            handleLogout={
              typeof handleLogout === "function" ? handleLogout : () => {}
            }
            setStatusMessage={
              typeof setStatusMessage === "function"
                ? setStatusMessage
                : () => {}
            }
          />
        )}

        {activeView === "home" && (
          <main id="top" className="overflow-hidden pt-24 lg:pt-28">
            <ModernHero
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              location={location}
              setLocation={setLocation}
              onSearch={searchServices}
            />
            {/*  <PopularServicesGrid openPopularService={openPopularService} /> >*/}
            <section
              id="services"
              className="home-section border-y border-[#ded7ca] bg-[#fbfaf6] dark:border-white/10 dark:bg-[#081229] text-white shadow-lg dark:bg-none dark:text-white"
            >
              <ModernPopularServices openPopularService={openPopularService} />
              <div className="mx-auto grid max-w-[1500px] lg:grid-cols-[350px_1fr]">
                <Categories
                  categories={categories}
                  selectedCategory={selectedCategory}
                  setSelectedCategory={(category) => {
                    setSelectedCategory(category);
                    setProviderVisibleCount(4);
                  }}
                />
                <Providers
                  services={filteredServices}
                  providerVisibleCount={providerVisibleCount}
                  setProviderVisibleCount={setProviderVisibleCount}
                  setSelectedService={setSelectedService}
                  ownProviderId={providerProfile?._id || ""}
                />
              </div>
            </section>
            <FAQ />
          </main>
        )}

        {activeView === "client" && !user && (
          <WorkspaceRecovery
            message="Your session could not be restored. Please log in again."
            onRecover={() => clearSessionState()}
          />
        )}

        {activeView === "client" &&
          ["user", "provider"].includes(user?.role) && (
            <ClientDashboard
              key={`client-${bookings
                .map(
                  (booking) =>
                    `${booking._id}:${booking.status}:${booking.estimateStatus}:${booking.paymentStatus}:${booking.clientRating || ""}`,
                )
                .join("|")}`}
              bookings={bookings}
              cancelClientBooking={cancelClientBooking}
              onAcceptEstimate={handleAcceptEstimate}
              onRejectEstimate={handleRejectEstimate}
              onSubmitReview={submitClientReview}
              onPayNow={handlePayNow}
              payingBookingId={payingBookingId}
              t={t}
              isProviderClientMode={user?.role === "provider"}
              onBrowseServices={browseServicesAsClient}
              onProviderDashboard={loadProviderDashboard}
              onRefreshBookings={refreshClientBookings}
              onOpenProfile={openProfileMenu}
              onLogout={handleLogout}
            />
          )}

        {activeView === "provider" && user?.role !== "provider" && (
          <WorkspaceRecovery
            message="Provider session could not be restored."
            onRecover={() => clearSessionState()}
          />
        )}

        {activeView === "provider" && user?.role === "provider" && (
          <ProviderDashboard
            key={`provider-${providerProfile?._id || "none"}-${providerRequests
              .map((booking) => `${booking._id}:${booking.status}`)
              .join("|")}-${providerBookings
              .map(
                (booking) =>
                  `${booking._id}:${booking.status}:${booking.estimateStatus}:${booking.paymentStatus}`,
              )
              .join("|")}`}
            providerProfile={providerProfile}
            providerRequests={providerRequests}
            providerBookings={providerBookings}
            providerEarnings={providerEarnings}
            acceptProviderRequest={acceptProviderRequest}
            rejectProviderRequest={rejectProviderRequest}
            updateProviderBookingStatus={updateProviderBookingStatus}
            submitEstimate={handleSubmitProviderEstimate}
            refreshDashboard={loadProviderDashboard}
            setStatusMessage={setStatusMessage}
            providerDashboardLocked={
              user?.role === "provider" &&
              providerProfile?.approvalStatus !== "approved"
            }
            onBookAsClient={openProviderClientDashboard}
            onOpenProfile={openProviderAccount}
            onLogout={handleLogout}
          />
        )}

        {activeView === "admin" && user?.role !== "admin" && (
          <WorkspaceRecovery
            message="Admin session could not be restored."
            onRecover={() => clearSessionState()}
          />
        )}

        {activeView === "admin" && user?.role === "admin" && (
          <NewAdminPanel
            key={adminData?.stats ? "admin-loaded" : "admin-loading"}
            adminData={adminData}
            selectedProviders={selectedProviders}
            setSelectedProviders={setSelectedProviders}
            updateProviderApproval={updateProviderApproval}
            updateBookingRequest={updateBookingRequest}
            setAdminData={setAdminData}
            refreshAdminContactMessages={refreshAdminContactMessages}
            setStatusMessage={setStatusMessage}
            adminEmail={user?.email || ""}
            refreshAdminPayments={loadAdminDashboard}
            onLogout={handleLogout}
          />
        )}

        {activeView === "home" && (
          <ClientSupportSection
            user={user}
            setStatusMessage={setStatusMessage}
          />
        )}
        {activeView === "home" && (
          <ServiceHubFooter onServiceClick={openPopularService} />
        )}
        <HelpSupportCenter
          user={user}
          onLogin={() => openClientAuth("login")}
        />
        <AnimatePresence>
          {statusMessage && (
            <ActionToast
              message={statusMessage}
              onClose={() => setStatusMessage("")}
            />
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {bookingOpen && (
          <BookingModal
            bookingForm={bookingForm}
            setBookingForm={setBookingForm}
            submitBooking={submitBooking}
            close={() => setBookingOpen(false)}
            categories={categories}
            user={user}
          />
        )}
      </AnimatePresence>
      {providerAccountOpen && (
        <ProviderAccountDetailsModal
          form={providerAccountForm}
          provider={providerData?.provider}
          onUpdate={() => setProviderAccountEditOpen(true)}
          onClose={() => {
            setProviderAccountOpen(false);
            setProviderAccountEditOpen(false);
          }}
        />
      )}
      {providerAccountEditOpen && (
        <ProviderAccountEditModal
          form={providerAccountForm}
          setForm={setProviderAccountForm}
          categories={categories}
          onSubmit={submitProviderAccount}
          onClose={() => setProviderAccountEditOpen(false)}
        />
      )}

      <AnimatePresence>
        {profileImageOpen && user && user.role !== "provider" && (
          <ProfileImageModal
            user={user}
            onClose={() => setProfileImageOpen(false)}
            onSave={updateProfileImage}
            onProfileSave={updateUserProfile}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {selectedService && (
          <ServiceModal
            service={selectedService}
            onBook={openBooking}
            onClose={() => setSelectedService(null)}
            canBook={
              user?.role !== "admin" &&
              !(
                selectedService.providerId &&
                providerProfile?._id &&
                String(selectedService.providerId) ===
                  String(providerProfile._id)
              )
            }
          />
        )}
      </AnimatePresence>
      {authMode && (
        <AuthModal
          mode={authMode}
          initialRole={authRole}
          lockedRole={authLocked}
          language={language}
          onClose={() => setAuthMode(null)}
          onModeChange={setAuthMode}
          onAuthSuccess={(nextUser) => {
            setUser(nextUser);
            setLoginMenuOpen(false);
            setAccountMenuOpen(false);
            setMoreMenuOpen(false);
            setMobileNavOpen(false);
            setActiveView(
              nextUser.role === "provider"
                ? "provider"
                : nextUser.role === "admin"
                  ? "admin"
                  : "client",
            );
            if (nextUser.role === "user") refreshClientBookings();
            setStatusMessage(
              `${formatRoleLabel(nextUser.role)} logged in successfully.`,
            );
          }}
        />
      )}
    </div>
  );
}

function WorkspaceRecovery({ message, onRecover }) {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 px-4 dark:bg-[#081229]">
      <section className="w-full max-w-lg rounded-[2rem] border border-slate-200 bg-white p-8 text-center shadow-xl dark:border-white/10 dark:bg-slate-900 dark:bg-none dark:bg-[#081229] dark:text-white">
        <ShieldCheck className="mx-auto h-12 w-12 text-teal-600" />
        <h1 className="mt-5 text-2xl font-black text-slate-950 dark:text-white">
          Workspace needs a fresh login
        </h1>
        <p className="mt-3 font-semibold text-slate-500 dark:text-slate-300">
          {message}
        </p>
        <button
          type="button"
          onClick={onRecover}
          className="mt-6 rounded-2xl bg-gradient-to-r from-teal-600 to-blue-600 px-6 py-3 font-black text-white"
        >
          Return to login
        </button>
      </section>
    </main>
  );
}

function DefaultProfileSymbol() {
  return (
    <span
      className="relative block h-full w-full overflow-hidden rounded-full bg-[#c7c7c7]"
      aria-hidden="true"
    >
      <span className="absolute left-1/2 top-[22%] h-[30%] w-[30%] -translate-x-1/2 rounded-full bg-white" />
      <span className="absolute bottom-[-5%] left-1/2 h-[46%] w-[64%] -translate-x-1/2 rounded-t-full bg-white" />
    </span>
  );
}

function ProfileImageModal({
  user,
  onClose,
  onSave,
  onProfileSave,
  onProviderDetails,
}) {
  const [preview, setPreview] = useState(user?.profileImage || "");
  const [busy, setBusy] = useState(false);
  const [profileBusy, setProfileBusy] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [error, setError] = useState("");
  const [profileForm, setProfileForm] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
    address: user?.address || "",
  });
  const label = `${user?.name || "User"} profile image`;
  const roleLabel = formatRoleLabel(user?.role || "user");
  const profileRows = [
    ["Account type", roleLabel],
    ["Email", user?.email || "Not available"],
    ["Phone", user?.phone || "Not available"],
    ["Address", user?.address || "Not available"],
  ];
  const updateProfileField = (field) => (event) =>
    setProfileForm((current) => ({ ...current, [field]: event.target.value }));

  const resizeImage = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const image = new Image();
        image.onload = () => {
          const maxSize = 720;
          const scale = Math.min(
            maxSize / image.width,
            maxSize / image.height,
            1,
          );
          const canvas = document.createElement("canvas");
          canvas.width = Math.max(Math.round(image.width * scale), 1);
          canvas.height = Math.max(Math.round(image.height * scale), 1);
          const context = canvas.getContext("2d");
          context.drawImage(image, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL("image/jpeg", 0.84));
        };
        image.onerror = () =>
          reject(new Error("Selected image could not be loaded."));
        image.src = reader.result;
      };
      reader.onerror = () =>
        reject(new Error("Selected image could not be read."));
      reader.readAsDataURL(file);
    });

  const chooseImage = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }

    try {
      setError("");
      setBusy(true);
      const nextPreview = await resizeImage(file);
      setPreview(nextPreview);
    } catch (uploadError) {
      setError(uploadError.message || "Image could not be prepared.");
    } finally {
      setBusy(false);
    }
  };

  const saveImage = async () => {
    setBusy(true);
    setError("");
    try {
      await onSave(preview);
    } catch (saveError) {
      setError(saveError.message || "Profile image could not be saved.");
    } finally {
      setBusy(false);
    }
  };

  const saveProfile = async (event) => {
    event.preventDefault();
    setProfileBusy(true);
    setError("");
    try {
      const updatedUser = await onProfileSave(profileForm);
      setProfileForm({
        name: updatedUser?.name || profileForm.name,
        phone: updatedUser?.phone || profileForm.phone,
        address: updatedUser?.address || profileForm.address,
      });
      setEditingProfile(false);
    } catch (saveError) {
      setError(saveError.message || "Profile could not be saved.");
    } finally {
      setProfileBusy(false);
    }
  };

  const openProviderDetails = () => {
    onClose();
    onProviderDetails?.();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[85] grid place-items-center bg-slate-950/65 p-3 backdrop-blur-sm sm:p-4"
    >
      <motion.div
        initial={{ y: 26, scale: 0.98 }}
        animate={{ y: 0, scale: 1 }}
        exit={{ y: 18, scale: 0.98 }}
        className="flex max-h-[92dvh] w-full max-w-5xl flex-col overflow-hidden rounded-[1.75rem] border border-white/70 bg-white shadow-2xl dark:border-white/10 dark:bg-slate-900"
      >
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 dark:border-white/10">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="grid h-10 w-10 flex-none place-items-center rounded-full bg-slate-100 text-slate-700 transition hover:bg-slate-200 dark:bg-white/10 dark:text-white"
              aria-label="Back from profile"
            >
              <ArrowLeft size={18} />
            </button>
            <div className="min-w-0">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-teal-700 dark:text-teal-300">
                {roleLabel} profile
              </p>
              <h2 className="mt-1 truncate text-2xl font-black tracking-[-0.03em] text-slate-950 dark:text-white">
                {user?.name || "My profile"}
              </h2>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setEditingProfile((current) => !current)}
              className="rounded-full bg-slate-950 px-4 py-2 text-sm font-black text-white transition hover:-translate-y-0.5 dark:bg-amber-300 dark:text-slate-950"
            >
              {editingProfile ? "Cancel" : "Edit"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="grid h-10 w-10 place-items-center rounded-full bg-slate-100 text-slate-700 transition hover:bg-slate-200 dark:bg-white/10 dark:text-white"
              aria-label="Close profile image editor"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="min-h-0 overflow-y-auto px-4 py-5 sm:px-5 sm:py-6">
          <div className="grid gap-5 lg:grid-cols-[0.82fr_1.18fr] lg:items-start">
            <div className="grid gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/5">
              <div className="mx-auto grid h-28 w-28 place-items-center overflow-hidden rounded-full border-4 border-white bg-slate-100 text-3xl font-black text-white shadow-2xl shadow-blue-600/20 ring-1 ring-slate-200 dark:border-slate-900 dark:bg-slate-800 dark:ring-white/10 sm:h-32 sm:w-32">
                {preview ? (
                  <img
                    src={preview}
                    alt={label}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <DefaultProfileSymbol />
                )}
              </div>

              <label className="group flex cursor-pointer items-center gap-3 rounded-2xl border border-dashed border-teal-300 bg-teal-50/70 p-4 text-left transition hover:-translate-y-0.5 hover:border-teal-500 hover:bg-teal-50 dark:border-teal-300/30 dark:bg-teal-300/10 dark:hover:bg-teal-300/15">
                <span className="grid h-11 w-11 flex-none place-items-center rounded-2xl bg-white text-teal-700 shadow-sm dark:bg-[#081229] dark:text-teal-300">
                  <UploadCloud size={20} />
                </span>
                <span className="min-w-0">
                  <span className="block font-black text-slate-950 dark:text-white">
                    Choose profile image
                  </span>
                  <span className="mt-1 block text-sm font-bold text-slate-500 dark:text-slate-300">
                    PNG, JPG, JPEG, or WEBP
                  </span>
                </span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  onChange={chooseImage}
                  className="sr-only"
                />
              </label>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                <button
                  type="button"
                  onClick={saveImage}
                  disabled={busy}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 font-black text-white shadow-lg shadow-slate-950/15 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-amber-300 dark:text-slate-950"
                >
                  <Camera size={18} />
                  {busy ? "Saving..." : "Save image"}
                </button>
                {preview && (
                  <button
                    type="button"
                    onClick={() => setPreview("")}
                    disabled={busy}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 font-black text-rose-700 transition hover:bg-rose-100 disabled:opacity-60 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-200"
                  >
                    <Trash2 size={17} />
                    Remove
                  </button>
                )}
              </div>
            </div>

            <div className="grid gap-4">
              {editingProfile ? (
                <form
                  onSubmit={saveProfile}
                  className="grid gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/5 sm:grid-cols-2"
                >
                  <FormInput
                    label="Name"
                    value={profileForm.name}
                    onChange={updateProfileField("name")}
                    placeholder="Your name"
                  />
                  <FormInput
                    label="Phone"
                    value={profileForm.phone}
                    onChange={updateProfileField("phone")}
                    placeholder="Mobile number"
                  />
                  <label className="grid gap-2 font-bold sm:col-span-2">
                    Address
                    <textarea
                      value={profileForm.address}
                      onChange={updateProfileField("address")}
                      placeholder="Your registered service address"
                      rows="3"
                      className="min-h-28 rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-teal-400 dark:border-white/10 dark:bg-[#081229]"
                    />
                  </label>
                  <button
                    type="submit"
                    disabled={profileBusy}
                    className="rounded-2xl bg-gradient-to-r from-teal-600 to-blue-600 px-5 py-3 font-black text-white shadow-lg shadow-blue-600/15 transition hover:-translate-y-0.5 disabled:opacity-60 sm:col-span-2"
                  >
                    {profileBusy ? "Saving..." : "Save profile"}
                  </button>
                </form>
              ) : (
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-white/5">
                  <div className="grid gap-1 border-b border-slate-200 px-4 py-3 dark:border-white/10 sm:grid-cols-[7.5rem_1fr] sm:gap-3">
                    <span className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">
                      Name
                    </span>
                    <span className="min-w-0 break-words text-sm font-black text-slate-900 dark:text-white">
                      {user?.name || "Not available"}
                    </span>
                  </div>
                  {profileRows.map(([field, value]) => (
                    <div
                      key={field}
                      className="grid gap-1 border-b border-slate-200 px-4 py-3 last:border-b-0 dark:border-white/10 sm:grid-cols-[7.5rem_1fr] sm:gap-3"
                    >
                      <span className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">
                        {field}
                      </span>
                      <span className="min-w-0 break-words text-sm font-black text-slate-900 dark:text-white">
                        {value}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {error && (
                <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700 dark:bg-rose-400/10 dark:text-rose-200">
                  {error}
                </p>
              )}
            </div>
          </div>

          {onProviderDetails && (
            <button
              type="button"
              onClick={openProviderDetails}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
            >
              Open provider details
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
// import { ChevronRight } from "lucide-react";

function Categories({ categories, selectedCategory, setSelectedCategory }) {
  const categoryIcons = {
    Plumber: "🚰",
    Electrician: "⚡",
    Carpenter: "🪚",
    Painter: "🎨",
    "AC Repair": "❄️",
    "Refrigerator Repair": "🧊",
    "Washing Machine Repair": "🧺",
    "TV Repair": "📺",
  };

  return (
    <>
      {/* ================= Mobile ================= */}
      <div className="border-b border-slate-200 bg-white px-4 py-4 dark:border-slate-700 dark:bg-slate-900 lg:hidden">
        <label
          htmlFor="category-select"
          className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300"
        >
          Select Service Category
        </label>
        <select
          id="category-select"
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-800 shadow-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:focus:ring-blue-800"
        >
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </div>

      {/* ================= Desktop Sidebar ================= */}
      <aside className="sticky top-24 hidden h-[calc(100vh-7rem)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900 lg:block">
        {/* Header */}
        <div className="border-b border-slate-200 bg-gradient-to-br from-slate-50 to-white px-6 py-6 dark:border-slate-700 dark:from-slate-900 dark:to-slate-800">
          <span className="inline-block rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
            Categories
          </span>
          <h2 className="mt-4 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Find Professionals
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Choose a category to explore trusted local service providers.
          </p>
        </div>

        {/* Category List */}
        <div className="scrollbar-hidden max-h-[calc(100vh-15rem)] space-y-1.5 overflow-y-auto p-4">
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setSelectedCategory(category)}
              className={`group flex w-full items-center justify-between rounded-xl border px-4 py-3 text-sm font-medium transition-all duration-200 ${
                selectedCategory === category
                  ? "border-blue-600 bg-blue-600 text-white shadow-md shadow-blue-200/50 dark:shadow-blue-900/30"
                  : "border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:bg-blue-50 hover:shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-slate-500 dark:hover:bg-slate-700"
              }`}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`flex h-10 w-10 items-center justify-center rounded-lg text-lg transition-all ${
                    selectedCategory === category
                      ? "bg-white/20 text-white"
                      : "bg-slate-100 text-slate-600 group-hover:bg-blue-100 group-hover:text-blue-600 dark:bg-slate-700 dark:text-slate-300 dark:group-hover:bg-slate-600 dark:group-hover:text-white"
                  }`}
                >
                  {categoryIcons[category] || "🔧"}
                </span>
                <span className="font-semibold">{category}</span>
              </div>
              <ChevronRight
                size={18}
                strokeWidth={2.5}
                className={`transition-all duration-200 ${
                  selectedCategory === category
                    ? "translate-x-1 text-white"
                    : "text-slate-400 group-hover:translate-x-1 group-hover:text-blue-500 dark:group-hover:text-blue-400"
                }`}
              />
            </button>
          ))}
        </div>
      </aside>
    </>
  );
}

// import { motion } from "framer-motion";
// import { Star, Sparkles } from "lucide-react";
// import { categoryImages } from "../utils/categoryImages";

function Providers({
  services,
  providerVisibleCount,
  setProviderVisibleCount,
  setSelectedService,
  ownProviderId = "",
}) {
  const providersGridRef = useRef(null);
  const providerBatchSize = 4;
  const visibleCount = Math.min(providerVisibleCount, services.length);
  const visibleServices = services.slice(0, visibleCount);
  const hasMoreProviders = visibleCount < services.length;
  const canShowLessProviders = visibleCount > providerBatchSize;

  const scrollToProvidersGrid = () => {
    window.setTimeout(() => {
      providersGridRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 0);
  };

  return (
    <div
      id="providers"
      className="home-section bg-white px-4 pb-16 pt-7 dark:bg-[#081229] sm:px-6 lg:px-8 lg:pb-20 lg:pt-7"
    >
      <div className="mx-auto max-w-[1500px]">
        {/* Header */}
        <div className="mb-10 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h2 className="home-section-title text-3xl font-bold tracking-tight text-slate-900 dark:text-white md:text-4xl">
              Most booked services
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Trusted professionals at your service
            </p>
          </div>
          <div className="rounded-full border border-slate-200 bg-slate-50 px-4 py-1.5 text-sm font-semibold text-slate-600 dark:border-white/10 dark:bg-slate-900 dark:text-slate-300">
            {services.length} available
          </div>
        </div>

        {/* Grid */}
        {visibleServices.length ? (
          <div
            ref={providersGridRef}
            className="scroll-mt-24 grid gap-6 sm:grid-cols-2 xl:grid-cols-4"
          >
            {visibleServices.map((service, index) => {
              const isOwnProviderCard = Boolean(
                service.providerId &&
                ownProviderId &&
                String(service.providerId) === String(ownProviderId),
              );

              return (
                <motion.article
                  key={service.id || service.providerId || service.name}
                  data-provider-card="true"
                  initial={{ opacity: 0, scale: 0.96 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true, margin: "-30px" }}
                  transition={{
                    delay: index * 0.05,
                    duration: 0.35,
                    ease: "easeOut",
                  }}
                  className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md dark:border-white/10 dark:bg-slate-900 dark:hover:border-blue-400/30 dark:hover:shadow-xl"
                >
                  {/* Image */}
                  <button
                    type="button"
                    onClick={() => setSelectedService(service)}
                    className="block w-full overflow-hidden bg-slate-100 text-left focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-800"
                    aria-label={`Open ${service.name} profile`}
                  >
                    <span className="relative block aspect-square overflow-hidden">
                      <img
                        src={
                          service.image ||
                          categoryImages[service.category] ||
                          categoryImages.Cleaning
                        }
                        alt={`${service.name} ${service.category} provider`}
                        loading="lazy"
                        decoding="async"
                        onError={(e) => {
                          e.currentTarget.src =
                            categoryImages[service.category] ||
                            categoryImages.Cleaning;
                        }}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/5 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                      {service.featured && (
                        <span className="absolute left-3 top-3 rounded-full bg-blue-600 px-2.5 py-0.5 text-xs font-semibold text-white shadow-md">
                          Featured
                        </span>
                      )}
                    </span>
                  </button>

                  {/* Content */}
                  <div className="px-4 pb-4 pt-3">
                    <button
                      type="button"
                      onClick={() => setSelectedService(service)}
                      className="text-left text-xl font-bold leading-7 text-slate-900 transition-colors hover:text-blue-600 dark:text-white dark:hover:text-blue-400"
                    >
                      {service.name}
                    </button>

                    <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-base font-medium text-slate-600 dark:text-slate-300">
                      <span className="inline-flex items-center gap-1">
                        <Star
                          size={15}
                          className="fill-slate-700 text-slate-700 dark:fill-amber-300 dark:text-amber-300"
                        />
                        {service.rating || 4.8}
                      </span>
                      {service.responseTime && (
                        <>
                          <span aria-hidden="true">•</span>
                          <span className="inline-flex items-center gap-1">
                            <Sparkles
                              size={14}
                              className="fill-blue-500 text-blue-500 dark:fill-blue-400 dark:text-blue-400"
                            />
                            {service.responseTime.includes("Instant")
                              ? service.responseTime
                              : "Instant"}
                          </span>
                        </>
                      )}
                      {service.location && (
                        <>
                          <span aria-hidden="true">•</span>
                          <span className="truncate">{service.location}</span>
                        </>
                      )}
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      <p className="text-2xl font-extrabold text-slate-900 dark:text-white">
                        {formatServiceChargeLabel(service.price)}
                      </p>
                      {isOwnProviderCard && (
                        <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-sm font-semibold text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                          Your profile
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Decorative corner accent */}
                  <div className="absolute -right-8 -top-8 h-16 w-16 rounded-full bg-blue-100/20 opacity-0 transition-opacity duration-300 group-hover:opacity-100 dark:bg-blue-400/10" />
                </motion.article>
              );
            })}
          </div>
        ) : (
          <EmptyState
            title="No providers found"
            copy="Try another service category or clear the search box."
          />
        )}

        {/* Load more buttons */}
        {(hasMoreProviders || canShowLessProviders) && (
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            {canShowLessProviders && (
              <motion.button
                type="button"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => {
                  setProviderVisibleCount((current) =>
                    Math.max(providerBatchSize, current - providerBatchSize),
                  );
                  scrollToProvidersGrid();
                }}
                className="rounded-full border border-slate-300 bg-white px-7 py-3 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:border-slate-400 hover:bg-slate-50 hover:text-slate-900 dark:border-white/20 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-white/40 dark:hover:bg-slate-700"
              >
                View less
              </motion.button>
            )}
            {hasMoreProviders && (
              <motion.button
                type="button"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() =>
                  setProviderVisibleCount((current) =>
                    Math.min(services.length, current + providerBatchSize),
                  )
                }
                className="rounded-full bg-blue-600 px-7 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-blue-500 dark:hover:bg-blue-600"
              >
                View more
              </motion.button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function FAQ() {
  return (
    <section
      id="faq"
      className="relative overflow-hidden bg-gradient-to-br from-white via-slate-50 to-blue-50 px-4 py-24 transition-colors dark:from-[#081229] dark:via-[#0B1F3A] dark:to-[#102747] sm:px-6 lg:px-8 lg:py-32 dark:bg-none dark:bg-[#081229] dark:text-white"
    >
      {/* Background Glow */}
      <div className="absolute -top-40 -left-40 h-[450px] w-[450px] rounded-full bg-cyan-400/15 blur-[170px] animate-pulse"></div>

      <div className="absolute top-1/2 left-1/3 h-[350px] w-[350px] rounded-full bg-pink-400/10 blur-[170px] animate-pulse"></div>

      <div className="absolute -bottom-40 -right-40 h-[450px] w-[450px] rounded-full bg-violet-400/15 blur-[170px] animate-pulse"></div>

      <div className="relative mx-auto max-w-6xl">
        {/* Badge */}
        <span className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-500 via-blue-500 to-violet-600 px-6 py-3 text-sm font-bold tracking-wider text-white shadow-xl">
          ✨ Frequently Asked Questions
        </span>

        {/* Heading */}
        <h2 className="mt-8 text-5xl font-black leading-tight text-slate-900 dark:text-white md:text-6xl">
          Answers before customers
          <span className="block bg-gradient-to-r from-cyan-600 via-blue-600 to-violet-600 bg-clip-text text-transparent">
            book home services.
          </span>
        </h2>

        <p className="mt-6 max-w-3xl text-xl leading-9 text-slate-600 dark:text-slate-300">
          Find answers to the most common questions about booking services,
          payments, providers and support.
        </p>

        {/* FAQ List */}
        <div className="mt-14 space-y-6">
          {faqItems.map((item, index) => (
            <details
              key={item.question}
              className="group overflow-hidden rounded-[30px] border border-slate-200 bg-white/90 backdrop-blur-xl shadow-lg transition-all duration-500 hover:-translate-y-2 hover:scale-[1.01] hover:border-cyan-400 hover:shadow-[0_25px_70px_rgba(59,130,246,0.18)] dark:border-white/10 dark:bg-[#0B1F3A]/90"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-5 px-6 py-6 text-lg font-bold text-slate-900 dark:text-white">
                <div className="flex items-center gap-5">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-500 to-violet-600 font-bold text-white shadow-lg transition duration-500 group-hover:rotate-6">
                    {String(index + 1).padStart(2, "0")}
                  </div>

                  <span>{item.question}</span>
                </div>

                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-cyan-500 to-violet-600 shadow-lg transition-all duration-500 group-open:rotate-90 group-hover:scale-110">
                  <ChevronRight className="h-5 w-5 text-white" />
                </div>
              </summary>

              <div className="px-6 pb-6">
                <div className="mt-2 h-px w-full bg-gradient-to-r from-cyan-500 via-blue-500 to-violet-500"></div>

                <p className="mt-6 text-[17px] leading-8 text-slate-600 dark:text-slate-300">
                  {item.answer}
                </p>
              </div>
            </details>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-20 rounded-[32px] border border-slate-200 bg-white/90 p-10 text-center shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-[#0B1F3A]/90">
          <h3 className="text-3xl font-black text-slate-900 dark:text-white">
            Still Have Questions?
          </h3>

          <p className="mt-4 text-lg text-slate-600 dark:text-slate-300">
            Our support team is always available to help you with bookings,
            payments and service-related queries.
          </p>

          <button
            type="button"
            onClick={() =>
              document.getElementById("contact")?.scrollIntoView({
                behavior: "smooth",
              })
            }
            className="group mt-8 inline-flex items-center gap-3 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-500 to-violet-600 px-8 py-4 font-bold text-white shadow-xl transition-all duration-500 hover:-translate-y-2 hover:scale-105 hover:shadow-[0_20px_60px_rgba(59,130,246,0.45)]"
          >
            <span>Contact Support</span>

            <span className="transition-transform duration-500 group-hover:translate-x-2">
              →
            </span>
          </button>
        </div>
      </div>
    </section>
  );
}

function ClientDashboard({
  bookings,
  cancelClientBooking,
  onAcceptEstimate,
  onRejectEstimate,
  onSubmitReview,
  onPayNow,
  payingBookingId,
  t = (key) => key,
  isProviderClientMode = false,
  onBrowseServices,
  onProviderDashboard,
  onRefreshBookings,
  onOpenProfile,
  onLogout,
}) {
  const [now, setNow] = useState(INITIAL_DASHBOARD_TIME);
  const [rejectTargetBooking, setRejectTargetBooking] = useState(null);
  const [cancelledPageOpen, setCancelledPageOpen] = useState(false);
  const [completedPageOpen, setCompletedPageOpen] = useState(false);
  const [bookingsPageOpen, setBookingsPageOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [reviewForms, setReviewForms] = useState({});
  const [reviewSubmittingId, setReviewSubmittingId] = useState("");
  const [refreshingClient, setRefreshingClient] = useState(false);
  const savedProviderCount = new Set(
    bookings
      .map(
        (booking) =>
          booking.assignedProvider?._id ||
          booking.requestedProvider?._id ||
          booking.assignedProvider ||
          booking.requestedProvider,
      )
      .filter(Boolean)
      .map(String),
  ).size;
  const notifications = [
    ...bookings
      .filter((booking) => booking.estimateStatus === "submitted")
      .map((booking) => ({
        title: "Estimate ready",
        message: `${booking.service} has a final estimate. Accept or reject it from booking history.`,
      })),
    ...bookings
      .filter(
        (booking) =>
          booking.estimateStatus === "accepted" &&
          booking.paymentStatus !== "paid",
      )
      .map((booking) => ({
        title: "Payment pending",
        message: `Complete payment for ${booking.service} so the provider can finish the job.`,
      })),
    ...bookings
      .filter(
        (booking) =>
          booking.status === "confirmed" && booking.paymentStatus === "paid",
      )
      .map((booking) => ({
        title: "Service confirmed",
        message: `${booking.service} payment is successful and the provider can complete the work.`,
      })),
  ].slice(0, 8);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30000);
    return () => window.clearInterval(timer);
  }, []);

  const bookingSections = [
    {
      title: "Pending bookings",
      copy: "Requests waiting for provider response appear here.",
      bookings: bookings.filter((booking) => booking.status === "pending"),
    },
    {
      title: "Active bookings",
      copy: "Accepted, confirmed, and in-progress services appear here.",
      bookings: bookings.filter((booking) =>
        [
          "accepted",
          "confirmed",
          "assigned",
          "on_the_way",
          "en_route",
          "arrived",
          "job_started",
        ].includes(booking.status),
      ),
    },
    {
      title: "Completed services",
      copy: "Finished services appear here.",
      bookings: bookings.filter((booking) => booking.status === "completed"),
    },
    {
      title: "Cancelled / Rejected services",
      copy: "Cancelled and rejected bookings appear here.",
      bookings: bookings.filter((booking) =>
        ["cancelled", "rejected"].includes(booking.status),
      ),
    },
  ];
  const statusBlocks = [
    {
      title: "Pending",
      icon: Clock,
      value: bookingSections[0].bookings.length,
      copy: "Waiting for provider response.",
      tone: "from-amber-50 to-white text-amber-700",
    },
    {
      title: "Active",
      icon: RefreshCw,
      value: bookingSections[1].bookings.length,
      copy: "Provider accepted and live work.",
      tone: "from-blue-50 to-white text-blue-700",
    },
    {
      title: "Completed",
      icon: CheckCircle,
      value: bookingSections[2].bookings.length,
      copy: "Finished service records.",
      tone: "from-emerald-50 to-white text-emerald-700",
    },
    {
      title: "Cancelled",
      icon: XCircle,
      value: bookingSections[3].bookings.length,
      copy: "Cancelled request records.",
      tone: "from-rose-50 to-white text-rose-700",
    },
  ];
  const clientSidebarItems = [
    {
      label: "Overview",
      icon: LayoutDashboard,
      active: !bookingsPageOpen && !completedPageOpen && !cancelledPageOpen,
      onClick: () => {
        setBookingsPageOpen(false);
        setCompletedPageOpen(false);
        setCancelledPageOpen(false);
      },
    },
    {
      label: "My bookings",
      icon: CalendarCheck,
      badge: bookings.length,
      active: bookingsPageOpen,
      onClick: () => {
        setBookingsPageOpen(true);
        setCompletedPageOpen(false);
        setCancelledPageOpen(false);
      },
    },
    {
      label: "Find providers",
      icon: UserRound,
      badge: savedProviderCount,
      onClick: onBrowseServices,
    },
    {
      label: "Completed & reviews",
      icon: Star,
      badge: bookings.filter(
        (booking) => booking.status === "completed" && !booking.clientRating,
      ).length,
      active: completedPageOpen,
      onClick: () => {
        setCompletedPageOpen(true);
        setBookingsPageOpen(false);
        setCancelledPageOpen(false);
      },
    },
    {
      label: "Cancelled",
      icon: XCircle,
      badge: bookingSections[3].bookings.length,
      active: cancelledPageOpen,
      onClick: () => {
        setCancelledPageOpen(true);
        setBookingsPageOpen(false);
        setCompletedPageOpen(false);
      },
    },
  ];

  const updateReviewForm = (bookingId, updates) => {
    setReviewForms((current) => ({
      ...current,
      [bookingId]: {
        rating: current[bookingId]?.rating || 5,
        review: current[bookingId]?.review || "",
        ...updates,
      },
    }));
  };

  const submitReview = async (booking) => {
    const form = reviewForms[booking._id] || {};
    setReviewSubmittingId(booking._id);
    try {
      const updatedBooking = await onSubmitReview?.(booking._id, {
        rating: Number(form.rating || booking.clientRating || 5),
        review: form.review ?? booking.clientReview ?? "",
      });
      if (updatedBooking) {
        setReviewForms((current) => {
          const next = { ...current };
          delete next[booking._id];
          return next;
        });
      }
    } finally {
      setReviewSubmittingId("");
    }
  };

  const refreshBookings = async () => {
    if (!onRefreshBookings || refreshingClient) return;
    setRefreshingClient(true);
    try {
      await onRefreshBookings();
    } finally {
      setRefreshingClient(false);
    }
  };

  const renderBookingCard = (booking) => {
    const provider =
      booking.assignedProvider || booking.requestedProvider || null;
    const providerName =
      booking.assignedProviderName ||
      booking.requestedProviderName ||
      provider?.name ||
      "Provider not accepted yet";
    return (
      <article key={booking._id} className="client-order-card">
        <div className="client-order-main">
          <div className="client-order-icon" aria-hidden="true">
            <BriefcaseBusiness size={19} />
          </div>
          <div className="client-order-copy">
            <div className="client-order-title-row">
              <div>
                <p className="client-order-kicker">
                  Booking #
                  {String(booking.bookingId || booking._id || "").slice(-8)}
                </p>
                <h3>{booking.service}</h3>
              </div>
              <StatusBadge status={booking.status} />
            </div>
            <div className="client-order-meta">
              <span>
                <CalendarCheck size={15} />{" "}
                {formatBookingDate(booking.preferredDate)},{" "}
                {formatBookingTime(booking.preferredTime)}
              </span>
              <span>
                <UserRound size={15} /> {providerName}
              </span>
              <span>
                <MapPin size={15} /> {booking.address || "Address not added"}
              </span>
            </div>
          </div>
        </div>
        <div className="client-order-footer">
          <div>
            <span>Estimate</span>
            <strong>
              {formatPrice(booking.finalEstimateAmount || booking.costEstimate)}
            </strong>
          </div>
          <button type="button" onClick={() => setSelectedBooking(booking)}>
            View details <ChevronRight size={16} />
          </button>
        </div>
      </article>
    );
  };

  const bookingDetailDrawer = selectedBooking
    ? (() => {
        const booking = selectedBooking;
        const provider =
          booking.assignedProvider || booking.requestedProvider || null;
        const providerName =
          booking.assignedProviderName ||
          booking.requestedProviderName ||
          provider?.name ||
          "Provider not assigned";
        const providerPrice =
          provider?.price || formatPrice(booking.costEstimate);
        const cancelState = getClientCancelState(booking, now);
        return (
          <motion.div
            className="client-booking-drawer-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onMouseDown={(event) =>
              event.target === event.currentTarget && setSelectedBooking(null)
            }
          >
            <motion.aside
              className="client-booking-drawer"
              initial={{ x: 36, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 36, opacity: 0 }}
              role="dialog"
              aria-modal="true"
              aria-label="Booking details"
            >
              <header>
                <div>
                  <span>ServiceHub booking</span>
                  <h2>Booking Details</h2>
                  <p>#{booking.bookingId || booking._id}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedBooking(null)}
                  aria-label="Close booking details"
                >
                  <X size={20} />
                </button>
              </header>
              <div className="client-booking-drawer-body">
                <section className="client-booking-provider dark:bg-none dark:bg-[#081229] dark:text-white">
                  <div
                    className="client-booking-provider-avatar"
                    aria-hidden="true"
                  >
                    <UserRound size={24} />
                  </div>
                  <div>
                    <span>Assigned professional</span>
                    <strong>{providerName}</strong>
                    <small>
                      {provider?.phone || "Contact available after acceptance"}
                    </small>
                  </div>
                  <StatusBadge status={booking.status} />
                </section>
                <div className="client-booking-summary">
                  <div>
                    <span>Service</span>
                    <strong>{booking.service}</strong>
                  </div>
                  <div>
                    <span>Scheduled</span>
                    <strong>{formatBookingDate(booking.preferredDate)}</strong>
                    <small>{formatBookingTime(booking.preferredTime)}</small>
                  </div>
                  <div>
                    <span>Estimate</span>
                    <strong>
                      {formatPrice(
                        booking.finalEstimateAmount || booking.costEstimate,
                      )}
                    </strong>
                    <small>{booking.paymentStatus || "unpaid"}</small>
                  </div>
                  <div>
                    <span>Payment status</span>
                    <PaymentStatusBadge
                      status={booking.paymentStatus || "unpaid"}
                    />
                  </div>
                </div>
                {booking.status !== "cancelled" && (
                  <section className="client-booking-section dark:bg-none dark:bg-[#081229] dark:text-white">
                    <h3>Service progress</h3>
                    <ClientJobProgress booking={booking} />
                  </section>
                )}
                <section className="client-booking-section client-booking-address dark:bg-none dark:bg-[#081229] dark:text-white">
                  <h3>Service information</h3>
                  <p>
                    <MapPin size={16} /> {booking.address}
                  </p>
                  <p>
                    <MessageCircle size={16} />{" "}
                    {booking.problemDescription || "No problem description"}
                  </p>
                </section>
                <ClientPaymentSection
                  booking={booking}
                  providerStartingPrice={providerPrice}
                  onAcceptEstimate={onAcceptEstimate}
                  onRejectClick={() => setRejectTargetBooking(booking)}
                  onPayNow={onPayNow}
                  isPaying={payingBookingId === booking._id}
                />
                {booking.status === "cancelled" && (
                  <section className="client-booking-section client-booking-cancelled dark:bg-none dark:bg-[#081229] dark:text-white">
                    <h3>Cancellation details</h3>
                    <p>
                      Cancelled by:{" "}
                      <strong>{booking.cancelledBy || "Not recorded"}</strong>
                    </p>
                    <p>
                      Cancelled:{" "}
                      {booking.cancelledAt
                        ? formatBookingDate(booking.cancelledAt)
                        : "Not recorded"}
                    </p>
                    <p>
                      Reason:{" "}
                      {booking.cancellationReason ||
                        booking.adminRejectionReason ||
                        "Reason not provided"}
                    </p>
                  </section>
                )}
                {booking.status === "completed" && (
                  <ClientReviewPanel
                    booking={booking}
                    form={reviewForms[booking._id]}
                    submitting={reviewSubmittingId === booking._id}
                    onChange={(updates) =>
                      updateReviewForm(booking._id, updates)
                    }
                    onSubmit={() => submitReview(booking)}
                  />
                )}
              </div>
              {!["completed", "cancelled"].includes(booking.status) && (
                <footer>
                  <p>
                    {booking.acceptedAt
                      ? "Cancellation closes 10 minutes after acceptance."
                      : "You can cancel until a provider accepts."}
                  </p>
                  <button
                    type="button"
                    disabled={!cancelState.canCancel}
                    onClick={async () => {
                      const cancelled = await cancelClientBooking(booking._id);
                      if (cancelled) {
                        setSelectedBooking(null);
                        setCancelledPageOpen(true);
                      }
                    }}
                  >
                    {cancelState.label}
                  </button>
                </footer>
              )}
            </motion.aside>
          </motion.div>
        );
      })()
    : null;

  if (bookingsPageOpen) {
    const currentBookings = [
      ...bookingSections[0].bookings,
      ...bookingSections[1].bookings,
    ];
    return (
      <DashboardShell
        title="My Bookings"
        subtitle="Track pending and active services without dashboard clutter."
        notifications={notifications}
        variant="client"
        sidebarItems={clientSidebarItems}
        onProfile={onOpenProfile}
        onLogout={onLogout}
        headerActions={
          <button
            type="button"
            onClick={refreshBookings}
            disabled={refreshingClient}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-black text-white dark:bg-amber-300 dark:text-slate-950"
          >
            <RefreshCw
              size={17}
              className={refreshingClient ? "animate-spin" : ""}
            />
            {refreshingClient ? "Refreshing" : "Refresh bookings"}
          </button>
        }
      >
        <div className="grid gap-5">
          {bookingSections.slice(0, 2).map((section) => (
            <Panel
              key={section.title}
              title={`${section.title} (${section.bookings.length})`}
            >
              <p className="mb-4 text-sm font-semibold text-slate-500 dark:text-slate-300">
                {section.copy}
              </p>
              <div className="grid gap-4 xl:grid-cols-2">
                {section.bookings.length ? (
                  section.bookings.map(renderBookingCard)
                ) : (
                  <EmptyState
                    title={`No ${section.title.toLowerCase()}`}
                    copy={section.copy}
                  />
                )}
              </div>
            </Panel>
          ))}
          {!currentBookings.length && (
            <button
              type="button"
              onClick={onBrowseServices}
              className="mx-auto rounded-2xl bg-slate-950 px-6 py-4 font-black text-white dark:bg-amber-300 dark:text-slate-950"
            >
              Browse services
            </button>
          )}
        </div>
        <AnimatePresence>
          {bookingDetailDrawer}
          {rejectTargetBooking && (
            <RejectEstimateModal
              booking={rejectTargetBooking}
              onClose={() => setRejectTargetBooking(null)}
              onReject={async (reason) => {
                await onRejectEstimate(rejectTargetBooking._id, reason);
                setRejectTargetBooking(null);
              }}
            />
          )}
        </AnimatePresence>
      </DashboardShell>
    );
  }

  if (cancelledPageOpen) {
    const cancelledBookings = bookingSections[3].bookings;
    return (
      <DashboardShell
        title="Cancelled Services"
        subtitle="Review every cancelled booking with provider, date, payment, address, and reason details."
        notifications={notifications}
        variant="client"
        sidebarItems={clientSidebarItems}
        onProfile={onOpenProfile}
        onLogout={onLogout}
      >
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setCancelledPageOpen(false)}
            aria-label="Back to client dashboard"
            className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-800 shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow-md dark:border-white/10 dark:bg-white/10 dark:text-white dark:hover:bg-white/15"
          >
            <ArrowLeft size={20} />
          </button>
          <span className="rounded-full bg-rose-50 px-4 py-2 text-sm font-black text-rose-700 dark:bg-rose-400/10 dark:text-rose-200">
            {cancelledBookings.length} cancelled
          </span>
        </div>
        <Panel title="Cancelled service details">
          <div className="grid gap-3 xl:grid-cols-2">
            {cancelledBookings.length ? (
              cancelledBookings.map(renderBookingCard)
            ) : (
              <EmptyState
                title="No cancelled services"
                copy="Cancelled bookings will appear here."
              />
            )}
          </div>
        </Panel>
        <AnimatePresence>{bookingDetailDrawer}</AnimatePresence>
      </DashboardShell>
    );
  }

  if (completedPageOpen) {
    const completedBookings = bookingSections[2].bookings;
    return (
      <DashboardShell
        title="Completed Services"
        subtitle="Review every completed service with provider, date, payment, address, and service details."
        notifications={notifications}
        variant="client"
        sidebarItems={clientSidebarItems}
        onProfile={onOpenProfile}
        onLogout={onLogout}
      >
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setCompletedPageOpen(false)}
            aria-label="Back to client dashboard"
            className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-800 shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow-md dark:border-white/10 dark:bg-white/10 dark:text-white dark:hover:bg-white/15"
          >
            <ArrowLeft size={20} />
          </button>
          <span className="rounded-full bg-emerald-50 px-4 py-2 text-sm font-black text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-200">
            {completedBookings.length} completed
          </span>
        </div>
        <Panel title="Completed service details">
          <div className="grid gap-3 xl:grid-cols-2">
            {completedBookings.length ? (
              completedBookings.map(renderBookingCard)
            ) : (
              <EmptyState
                title="No completed services"
                copy="Completed bookings will appear here."
              />
            )}
          </div>
        </Panel>
        <AnimatePresence>{bookingDetailDrawer}</AnimatePresence>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell
      title={
        isProviderClientMode
          ? t("clientBookingDashboard")
          : t("clientDashboardTitle")
      }
      subtitle={
        isProviderClientMode
          ? t("providerClientSubtitle")
          : t("clientDashboardSubtitle")
      }
      notifications={notifications}
      workspaceLabel={t("workspace")}
      variant="client"
      sidebarItems={clientSidebarItems}
      onProfile={onOpenProfile}
      onLogout={onLogout}
      headerActions={
        <button
          type="button"
          onClick={refreshBookings}
          disabled={refreshingClient}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-black text-white shadow-lg shadow-slate-950/10 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-amber-300 dark:text-slate-950"
        >
          <RefreshCw
            size={17}
            className={refreshingClient ? "animate-spin" : ""}
          />
          {refreshingClient ? "Refreshing" : "Refresh"}
        </button>
      }
    >
      <div className="mb-6 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onBrowseServices}
          className="rounded-xl bg-gradient-to-r from-teal-600 to-blue-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-600/20 transition hover:-translate-y-0.5"
        >
          {t("browseServices")}
        </button>
        {isProviderClientMode && (
          <>
            <button
              type="button"
              onClick={onProviderDashboard}
              className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/10 dark:text-white dark:hover:bg-white/15"
            >
              {t("providerDashboardButton")}
            </button>
          </>
        )}
      </div>
      <div className="grid gap-5 lg:grid-cols-3">
        <StatCard
          icon={CalendarCheck}
          label="My bookings"
          value={bookings.length}
        />
        <StatCard
          icon={Heart}
          label="Saved providers"
          value={savedProviderCount}
        />
        <StatCard
          icon={Star}
          label="Pending reviews"
          value={
            bookings.filter(
              (booking) =>
                booking.status === "completed" && !booking.clientRating,
            ).length
          }
        />
      </div>
      <div className="mt-6 grid gap-3 md:grid-cols-4">
        {statusBlocks.map((block) => (
          <button
            key={block.title}
            type="button"
            onClick={() => {
              if (block.title === "Completed") {
                setCompletedPageOpen(true);
                return;
              }
              if (block.title === "Cancelled") {
                setCancelledPageOpen(true);
                return;
              }
              setBookingsPageOpen(true);
            }}
            className={`dashboard-status-card rounded-2xl border border-slate-200 bg-gradient-to-br ${block.tone} p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-white/10 dark:from-white/10 dark:to-white/5`}
          >
            <span
              className={`dashboard-status-icon dashboard-status-icon-${block.title.toLowerCase()}`}
              aria-hidden="true"
            >
              <block.icon size={20} />
            </span>
            <p className="text-3xl font-black text-slate-950 dark:text-white">
              {block.value}
            </p>
            <p className="mt-1 font-black">{block.title}</p>
            <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-300">
              {block.copy}
            </p>
            {block.title === "Cancelled" && (
              <span className="mt-3 inline-flex rounded-full bg-rose-600 px-4 py-2 text-xs font-black text-white shadow-lg shadow-rose-600/15">
                Cancelled services
              </span>
            )}
            {block.title === "Completed" && (
              <span className="mt-3 inline-flex rounded-full bg-emerald-600 px-4 py-2 text-xs font-black text-white shadow-lg shadow-emerald-600/15">
                Completed services
              </span>
            )}
          </button>
        ))}
      </div>
      <div className="dashboard-overview-grid mt-6 grid gap-5 xl:grid-cols-2">
        <Panel title="Recent booking activity">
          <div className="grid gap-3">
            {bookings.slice(0, 3).map((booking) => (
              <button
                key={booking._id}
                type="button"
                onClick={() => setBookingsPageOpen(true)}
                className="dashboard-list-row"
              >
                <span>
                  <strong>{booking.service}</strong>
                  <small>
                    {formatBookingDate(booking.preferredDate)} ·{" "}
                    {formatBookingTime(booking.preferredTime)}
                  </small>
                </span>
                <StatusBadge status={booking.status} />
              </button>
            ))}
            {!bookings.length && (
              <EmptyState
                title="No booking activity yet"
                copy="Book a service and every update will appear here."
              />
            )}
          </div>
        </Panel>
        <Panel title="Payments and estimates">
          <div className="grid gap-3">
            {bookings
              .filter(
                (booking) => booking.estimateStatus || booking.paymentStatus,
              )
              .slice(0, 3)
              .map((booking) => (
                <button
                  key={booking._id}
                  type="button"
                  onClick={() => setBookingsPageOpen(true)}
                  className="dashboard-list-row"
                >
                  <span>
                    <strong>{booking.service}</strong>
                    <small>
                      Estimate: {booking.estimateStatus || "not submitted"}
                    </small>
                  </span>
                  <PaymentStatusBadge
                    status={booking.paymentStatus || "unpaid"}
                  />
                </button>
              ))}
            {!bookings.some(
              (booking) => booking.estimateStatus || booking.paymentStatus,
            ) && (
              <EmptyState
                title="No payment updates"
                copy="Estimates and payment actions will appear here."
              />
            )}
          </div>
        </Panel>
      </div>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={() => setBookingsPageOpen(true)}
          className="rounded-2xl border border-slate-200 bg-white px-6 py-4 font-black text-slate-800 shadow-sm dark:border-white/10 dark:bg-white/10 dark:text-white"
        >
          Open all bookings
        </button>
        <div className="mt-5 flex justify-center">
          <button
            type="button"
            onClick={onBrowseServices}
            className="rounded-2xl bg-slate-950 px-6 py-4 font-black text-white dark:bg-amber-300 dark:text-slate-950"
          >
            {t("bookAnotherService")}
          </button>
        </div>
      </div>
      <AnimatePresence>
        {bookingDetailDrawer}
        {rejectTargetBooking && (
          <RejectEstimateModal
            booking={rejectTargetBooking}
            onClose={() => setRejectTargetBooking(null)}
            onReject={async (reason) => {
              await onRejectEstimate(rejectTargetBooking._id, reason);
              setRejectTargetBooking(null);
            }}
          />
        )}
      </AnimatePresence>
    </DashboardShell>
  );
}

function ClientJobProgress({ booking }) {
  const status = booking.status || "pending";
  const normalizedStatus = normalizeTrackingStatus(status);
  const activeIndex = getActiveStepIndex(status);
  const trackingEvents = booking.trackingEvents || [];
  const isPendingRequest = status === "pending";
  const timestampFallbacks = {
    booking_confirmed:
      booking.acceptedAt ||
      booking.assignedAt ||
      booking.updatedAt ||
      booking.createdAt,
    en_route: booking.providerLocation?.updatedAt,
    arrived: trackingEvents.find((event) => event.status === "arrived")
      ?.updatedAt,
    job_started: trackingEvents.find((event) => event.status === "job_started")
      ?.updatedAt,
    completed: booking.completedAt,
  };

  return (
    <div className="mt-3 rounded-2xl border border-blue-100 bg-white p-4 text-slate-950 shadow-md shadow-blue-900/5 dark:border-white/10 dark:bg-white/95 dark:text-slate-950">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-700">
            Track order
          </p>
          <p className="mt-1 text-sm font-black text-slate-950">
            {isPendingRequest
              ? "Request pending"
              : trackingSteps[activeIndex]?.label || "Booking confirmed"}
          </p>
        </div>
        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black capitalize text-blue-700">
          {String(status).replace(/_/g, " ")}
        </span>
      </div>
      <div className="grid gap-0">
        {trackingSteps.map((step, index) => {
          const event = getLatestTrackingEvent(trackingEvents, step);
          const displayStep =
            isPendingRequest && step.id === "booking_confirmed"
              ? {
                  ...step,
                  label: "Request pending",
                  copy: "Waiting for provider acceptance",
                }
              : step;
          const isDone = index < activeIndex || status === "completed";
          const isActive =
            step.id === normalizedStatus ||
            (status === "pending" && index === 0);
          const isMuted = !isDone && !isActive;
          const updatedAt = event?.updatedAt || timestampFallbacks[step.id];

          return (
            <div
              key={step.id}
              className="relative grid grid-cols-[34px_1fr] gap-3 pb-4 last:pb-0"
            >
              {index < trackingSteps.length - 1 && (
                <span
                  className={`absolute left-[16px] top-7 h-full w-0.5 ${isDone ? "bg-emerald-500" : "bg-slate-200"}`}
                />
              )}
              <span
                className={`relative z-10 grid h-8 w-8 place-items-center rounded-full border-2 bg-white ${isActive ? "border-blue-600 text-blue-600 shadow-[0_0_0_5px_rgba(37,99,235,0.12)]" : isDone ? "border-emerald-500 bg-emerald-500 text-white" : "border-slate-300 text-slate-400"}`}
              >
                {isDone ? (
                  <CheckCircle size={15} strokeWidth={3} />
                ) : isActive ? (
                  <span className="h-2.5 w-2.5 rounded-full bg-current" />
                ) : (
                  index + 1
                )}
              </span>
              <div
                className={`min-w-0 rounded-xl px-2 pb-1 ${isActive ? "bg-blue-50/70" : ""}`}
              >
                <p
                  className={`text-base font-black ${isMuted ? "text-slate-400" : isDone ? "text-emerald-700" : "text-blue-700"}`}
                >
                  {displayStep.label}
                </p>
                <p
                  className={`mt-1 text-sm font-bold ${isMuted ? "text-slate-400" : "text-slate-500"}`}
                >
                  {updatedAt
                    ? `Updated ${formatTrackingEventTime(updatedAt)}`
                    : displayStep.copy}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ClientPaymentSection({
  booking,
  providerStartingPrice,
  onAcceptEstimate,
  onRejectClick,
  onPayNow,
  isPaying,
}) {
  const estimateStatus = booking.estimateStatus || "not_submitted";
  const paymentStatus = booking.paymentStatus || "unpaid";
  const hasEstimate =
    estimateStatus !== "not_submitted" || booking.finalEstimateAmount;
  const startingPrice =
    providerStartingPrice ||
    booking.assignedProvider?.price ||
    booking.requestedProvider?.price ||
    "Not available";
  const startingPriceAmount = parseMoneyValue(startingPrice);
  const providerEstimateAmount = Number(booking.finalEstimateAmount || 0);
  const finalEstimateTotal =
    providerEstimateAmount > 0
      ? providerEstimateAmount + startingPriceAmount
      : 0;
  const estimateHistory = Array.isArray(booking.estimateHistory)
    ? booking.estimateHistory
    : [];
  const latestEstimateEntry = estimateHistory.length
    ? estimateHistory[estimateHistory.length - 1]
    : null;
  const previousEstimateEntries =
    estimateHistory.length > 1
      ? [...estimateHistory].slice(0, -1).reverse()
      : [];
  if (!hasEstimate) return null;

  return (
    <div className="mt-4 rounded-2xl border border-teal-100 bg-teal-50/70 p-4 dark:border-teal-400/20 dark:bg-teal-400/10">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-teal-700 dark:text-teal-200">
            Payment & Estimate
          </p>
          <p className="mt-2 text-sm font-semibold text-slate-600 dark:text-slate-300">
            Provider sends the latest final estimate before online payment.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <EstimateStatusBadge status={estimateStatus} />
          <PaymentStatusBadge status={paymentStatus} />
        </div>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <div className="rounded-xl bg-white p-3 shadow-sm dark:bg-white/10">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">
            Provider Starting Price
          </p>
          <p className="mt-1 font-black text-teal-700 dark:text-teal-200">
            {startingPrice}
          </p>
          <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-300">
            Registered on platform
          </p>
        </div>
        <div className="rounded-xl bg-white p-3 shadow-sm dark:bg-white/10">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">
            Final Estimate
          </p>
          <p className="mt-1 font-black text-emerald-700 dark:text-emerald-200">
            {finalEstimateTotal ? formatMoney(finalEstimateTotal) : "Waiting"}
          </p>
          <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-300">
            {providerEstimateAmount > 0
              ? `${formatMoney(startingPriceAmount)} + ${formatMoney(providerEstimateAmount)}`
              : "Submitted by provider"}
          </p>
        </div>
        <div className="rounded-xl bg-white p-3 shadow-sm dark:bg-white/10">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">
            Payment Status
          </p>
          <div className="mt-1">
            <PaymentStatusBadge status={paymentStatus} />
          </div>
        </div>
      </div>
      {latestEstimateEntry?.submittedAt && (
        <div className="mt-4 rounded-xl bg-slate-100 p-3 text-sm text-slate-700 dark:bg-slate-900/70 dark:text-slate-200">
          <p className="font-black">Latest estimate sent</p>
          <p className="mt-1">
            {formatEstimateTimestamp(latestEstimateEntry.submittedAt)} for{" "}
            {formatMoney(latestEstimateEntry.amount)}
          </p>
        </div>
      )}
      {previousEstimateEntries.length > 0 && (
        <div className="mt-4 rounded-xl bg-white p-3 shadow-sm dark:bg-white/10">
          <p className="text-sm font-black text-slate-900 dark:text-white">
            Estimate history
          </p>
          <div className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-300">
            {previousEstimateEntries.map((entry, index) => (
              <div
                key={`${entry.submittedAt || index}-${entry.amount}`}
                className="rounded-2xl border border-slate-200 px-3 py-2 dark:border-white/10"
              >
                <p className="font-semibold">{formatMoney(entry.amount)}</p>
                <p>
                  {formatEstimateTimestamp(entry.submittedAt)} ·{" "}
                  {entry.status === "rejected" ? "Rejected" : "Revised"}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
      {estimateStatus === "submitted" && (
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => onAcceptEstimate(booking._id)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-black text-white shadow-lg shadow-emerald-600/15 transition hover:-translate-y-0.5"
          >
            <CheckCircle size={18} /> Accept Estimate
          </button>
          <button
            type="button"
            onClick={onRejectClick}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-600 px-4 py-3 text-sm font-black text-white shadow-lg shadow-orange-600/15 transition hover:-translate-y-0.5"
          >
            <XCircle size={18} /> Reject Estimate
          </button>
        </div>
      )}
      {estimateStatus === "accepted" && paymentStatus !== "paid" && (
        <button
          type="button"
          onClick={() => onPayNow(booking)}
          disabled={isPaying}
          className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-600 to-blue-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-600/15 transition hover:-translate-y-0.5 disabled:opacity-60"
        >
          <CreditCard size={18} />{" "}
          {isPaying ? "Opening checkout..." : "Pay now"}
        </button>
      )}
      {paymentStatus === "paid" && (
        <div className="mt-4 rounded-xl bg-emerald-100 px-4 py-3 text-sm font-black text-emerald-800 dark:bg-emerald-400/10 dark:text-emerald-100">
          <span className="inline-flex items-center gap-2">
            <CheckCircle size={18} /> Payment completed successfully
          </span>
          {booking.razorpayPaymentId && (
            <p className="mt-2 break-all text-xs text-emerald-700 dark:text-emerald-100">
              Payment ID: {booking.razorpayPaymentId}
            </p>
          )}
        </div>
      )}
      {estimateStatus === "rejected" && (
        <div className="mt-4 rounded-xl bg-orange-100 px-4 py-3 text-sm font-black text-orange-800 dark:bg-orange-400/10 dark:text-orange-100">
          Estimate rejected. Rs. 200 penalty applied.
        </div>
      )}
    </div>
  );
}

function ClientReviewPanel({ booking, form, submitting, onChange, onSubmit }) {
  const selectedRating = Number(form?.rating || booking.clientRating || 5);
  const reviewText = form?.review ?? booking.clientReview ?? "";
  const alreadyReviewed = Boolean(booking.clientRating);

  return (
    <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50/80 p-3 dark:border-amber-300/20 dark:bg-amber-300/10">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-black text-slate-950 dark:text-white">
            {alreadyReviewed ? "Your review" : "Rate this service"}
          </p>
          <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-300">
            Share feedback about the provider's work.
          </p>
        </div>
        {alreadyReviewed && (
          <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-amber-700 shadow-sm dark:bg-white/10 dark:text-amber-100">
            Reviewed
          </span>
        )}
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5" aria-label="Rating">
        {[1, 2, 3, 4, 5].map((rating) => (
          <button
            key={rating}
            type="button"
            onClick={() => onChange({ rating })}
            className={`grid h-9 w-9 place-items-center rounded-xl border text-sm font-black transition hover:-translate-y-0.5 ${rating <= selectedRating ? "border-amber-300 bg-amber-300 text-slate-950 shadow-sm" : "border-slate-200 bg-white text-slate-400 dark:border-white/10 dark:bg-white/10"}`}
            aria-label={`${rating} star${rating === 1 ? "" : "s"}`}
          >
            <Star
              size={17}
              fill={rating <= selectedRating ? "currentColor" : "none"}
            />
          </button>
        ))}
      </div>
      <textarea
        value={reviewText}
        onChange={(event) => onChange({ review: event.target.value })}
        rows="3"
        maxLength="600"
        placeholder="Write a short review for this provider..."
        className="mt-3 w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 outline-none transition focus:border-amber-300 focus:ring-4 focus:ring-amber-300/20 dark:border-white/10 dark:bg-[#081229] dark:text-white"
      />
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-300">
          {reviewText.length}/600 characters
        </p>
        <button
          type="button"
          onClick={onSubmit}
          disabled={submitting}
          className="rounded-xl bg-slate-950 px-4 py-2 text-xs font-black text-white shadow-lg shadow-slate-950/10 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-amber-300 dark:text-slate-950"
        >
          {submitting
            ? "Saving..."
            : alreadyReviewed
              ? "Update review"
              : "Submit review"}
        </button>
      </div>
    </div>
  );
}

function ProviderDashboard({
  providerProfile,
  providerRequests,
  providerBookings,
  providerEarnings,
  acceptProviderRequest,
  rejectProviderRequest,
  updateProviderBookingStatus,
  submitEstimate,
  refreshDashboard,
  setStatusMessage,
  providerDashboardLocked,
  onBookAsClient,
  onOpenProfile,
  onLogout,
}) {
  const [cancelTargetBooking, setCancelTargetBooking] = useState(null);
  const [rejectTargetBooking, setRejectTargetBooking] = useState(null);
  const [estimateTargetBooking, setEstimateTargetBooking] = useState(null);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [historyPageOpen, setHistoryPageOpen] = useState(false);
  const [providerPage, setProviderPage] = useState("overview");
  const confirmedJobs = providerBookings.filter(
    (booking) =>
      !["completed", "cancelled", "rejected"].includes(booking.status),
  );
  const historyJobs = providerBookings.filter((booking) =>
    ["completed", "cancelled", "rejected"].includes(booking.status),
  );
  const earningsSummary = providerEarnings?.summary || {};
  const awaitingClientPayment = providerBookings.filter(
    (booking) =>
      booking.estimateStatus === "accepted" && booking.paymentStatus !== "paid",
  ).length;
  const approvalStatus = providerProfile?.approvalStatus || "pending";
  const isDashboardLocked = Boolean(
    providerDashboardLocked ||
    !providerProfile ||
    approvalStatus !== "approved",
  );
  const approvalTitle =
    approvalStatus === "rejected"
      ? "Approval not granted"
      : "Waiting for admin approval";
  const approvalCopy =
    approvalStatus === "rejected"
      ? "Your provider request was rejected by admin. Please update your profile or contact support before taking jobs."
      : "Your provider registration is under admin review. The dashboard will unlock automatically after admin approval.";
  const notifications = [
    ...(isDashboardLocked
      ? [{ title: approvalTitle, message: approvalCopy }]
      : []),
    ...providerRequests.map((booking) => ({
      title: "New client request",
      message: `New ${booking.service} request is waiting. Client name and phone unlock after accept.`,
    })),
    ...providerBookings
      .filter(
        (booking) =>
          booking.paymentStatus === "paid" && booking.status !== "completed",
      )
      .map((booking) => ({
        title: "Payment received",
        message: `${booking.service} is paid. You can now mark it completed.`,
      })),
    ...providerBookings
      .filter(
        (booking) =>
          booking.estimateStatus === "accepted" &&
          booking.paymentStatus !== "paid",
      )
      .map((booking) => ({
        title: "Waiting for client payment",
        message: `${booking.service} estimate accepted, payment is still pending.`,
      })),
  ].slice(0, 8);
  const providerSidebarItems = [
    {
      label: "Overview",
      icon: LayoutDashboard,
      active: !historyPageOpen && providerPage === "overview",
      onClick: () => {
        setHistoryPageOpen(false);
        setProviderPage("overview");
      },
    },
    {
      label: "Requests",
      icon: Bell,
      badge: providerRequests.length,
      active: !historyPageOpen && providerPage === "requests",
      onClick: () => {
        setHistoryPageOpen(false);
        setProviderPage("requests");
      },
    },
    {
      label: "Active jobs",
      icon: BriefcaseBusiness,
      badge: confirmedJobs.length,
      active: !historyPageOpen && providerPage === "jobs",
      onClick: () => {
        setHistoryPageOpen(false);
        setProviderPage("jobs");
      },
    },
    {
      label: "Earnings",
      icon: Wallet,
      active: !historyPageOpen && providerPage === "earnings",
      onClick: () => {
        setHistoryPageOpen(false);
        setProviderPage("earnings");
      },
    },
    {
      label: "History",
      icon: ListChecks,
      badge: historyJobs.length,
      active: historyPageOpen,
      onClick: () => setHistoryPageOpen(true),
    },
    {
      label: "Book as client",
      icon: CalendarCheck,
      onClick: onBookAsClient,
    },
  ];
  const token = localStorage.getItem("servicehub_token");
  const handleBookingAlert = useCallback(
    (event) => {
      setStatusMessage(
        `New booking alert: ${event.clientName || "Client"} shared ${event.clientLocation ? "GPS location" : "an address"} for ${event.service}.`,
      );
      refreshDashboard?.();
    },
    [refreshDashboard, setStatusMessage],
  );

  useProviderAlerts({
    apiUrl: SOCKET_API_URL,
    token,
    enabled: Boolean(providerProfile) && !isDashboardLocked,
    onBookingAlert: handleBookingAlert,
  });

  if (isDashboardLocked) {
    return (
      <DashboardShell
        title="Provider Dashboard"
        subtitle="Your provider workspace will open after admin approval."
        notifications={notifications}
        variant="provider"
        sidebarItems={providerSidebarItems}
        onProfile={onOpenProfile}
        onLogout={onLogout}
      >
        <ProviderApprovalWaitCard
          approvalStatus={approvalStatus}
          approvalTitle={approvalTitle}
          approvalCopy={approvalCopy}
          providerProfile={providerProfile}
          refreshDashboard={refreshDashboard}
          setStatusMessage={setStatusMessage}
        />
      </DashboardShell>
    );
  }

  if (historyPageOpen) {
    return (
      <ProviderClientHistoryPage
        historyJobs={historyJobs}
        notifications={notifications}
        refreshDashboard={refreshDashboard}
        onBack={() => setHistoryPageOpen(false)}
        sidebarItems={providerSidebarItems}
        onProfile={onOpenProfile}
        onLogout={onLogout}
      />
    );
  }

  return (
    <DashboardShell
      title={
        {
          overview: "Provider Overview",
          requests: "Client Requests",
          jobs: "Active Service Jobs",
          earnings: "Earnings & Payouts",
        }[providerPage]
      }
      subtitle={
        {
          overview: "Your daily work summary, kept simple and actionable.",
          requests: "Review new requests and accept the right jobs.",
          jobs: "Run travel, arrival, estimate, payment and completion from one focused workspace.",
          earnings: "Track payable revenue and withdraw available earnings.",
        }[providerPage]
      }
      notifications={notifications}
      variant="provider"
      sidebarItems={providerSidebarItems}
      onProfile={onOpenProfile}
      onLogout={onLogout}
      headerActions={
        <button
          type="button"
          onClick={onBookAsClient}
          className="rounded-full bg-gradient-to-r from-teal-600 to-blue-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-600/20 transition hover:-translate-y-0.5"
        >
          Book as client
        </button>
      }
    >
      <div className="relative">
        <div
          className={
            isDashboardLocked
              ? "pointer-events-none select-none blur-sm opacity-45"
              : ""
          }
          aria-hidden={isDashboardLocked}
        >
          <div className="mb-5 flex flex-wrap justify-end gap-3">
            <button
              type="button"
              onClick={refreshDashboard}
              className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-black text-white shadow-lg shadow-slate-950/10 transition hover:-translate-y-0.5 dark:bg-amber-300 dark:text-slate-950"
            >
              Refresh dashboard
            </button>
          </div>
          {providerPage === "overview" && (
            <div className="grid gap-5 lg:grid-cols-4">
              <StatCard
                icon={IndianRupee}
                label="Projected earnings"
                value={`Rs. ${providerBookings.reduce((sum, booking) => sum + (booking.costEstimate || 0), 0).toLocaleString("en-IN")}`}
              />
              <StatCard
                icon={Bell}
                label="New requests"
                value={providerRequests.length}
              />
              <StatCard
                icon={BriefcaseBusiness}
                label="Accepted jobs"
                value={providerBookings.length}
              />
              <StatCard
                icon={Star}
                label="Rating"
                value={providerProfile?.rating || "0.0"}
              />
            </div>
          )}
          {providerPage === "earnings" && (
            <div className="grid gap-5 lg:grid-cols-4">
              <ProviderWithdrawCard
                earningsSummary={earningsSummary}
                providerProfile={providerProfile}
                onWithdrawClick={() => setWithdrawOpen(true)}
              />
              <PaymentSummaryCard
                icon={Clock}
                title="Pending Earnings"
                amount={formatMoney(earningsSummary.pendingEarnings || 0)}
                description="Expected 80% share from pending payments."
              />
              <PaymentSummaryCard
                icon={CheckCircle}
                title="Completed Paid Bookings"
                amount={earningsSummary.totalBookingsPaid || 0}
                description="Bookings with verified Razorpay payments."
              />
              <PaymentSummaryCard
                icon={CreditCard}
                title="Awaiting Client Payment"
                amount={awaitingClientPayment}
                description="Accepted estimates waiting for checkout."
              />
            </div>
          )}
          {providerPage === "requests" && (
            <div className="mt-2">
              <Panel title={`New client requests (${providerRequests.length})`}>
                <div className="grid gap-4">
                  {providerRequests.length ? (
                    providerRequests.map((booking) => (
                      <JobCard
                        key={booking._id}
                        booking={booking}
                        actionLabel="Accept request"
                        onAction={() => acceptProviderRequest(booking._id)}
                        secondaryActionLabel="Reject request"
                        secondaryAction={() => setRejectTargetBooking(booking)}
                        alertMode
                      />
                    ))
                  ) : (
                    <EmptyState
                      title="No new requests"
                      copy={`New ${providerProfile?.category || "service"} bookings will appear here.`}
                    />
                  )}
                </div>
              </Panel>
            </div>
          )}
          {providerPage === "jobs" && (
            <div className="mt-2">
              <Panel title={`Confirmed service jobs (${confirmedJobs.length})`}>
                <div className="grid gap-4">
                  {confirmedJobs.length ? (
                    confirmedJobs.map((booking) => (
                      <div key={booking._id} className="grid gap-3">
                        <JobCard
                          booking={booking}
                          secondaryAction={() =>
                            setCancelTargetBooking(booking)
                          }
                          onEstimateClick={
                            booking.status === "arrived" ||
                            (booking.status === "job_started" &&
                              booking.paymentStatus !== "paid")
                              ? () => setEstimateTargetBooking(booking)
                              : null
                          }
                        />
                        <ProviderRoutePanel
                          booking={booking}
                          updateProviderBookingStatus={
                            updateProviderBookingStatus
                          }
                          setStatusMessage={setStatusMessage}
                          apiUrl={SOCKET_API_URL}
                        />
                      </div>
                    ))
                  ) : (
                    <EmptyState
                      title="No confirmed jobs yet"
                      copy="Accepted client jobs will appear here until they are completed or cancelled."
                    />
                  )}
                </div>
              </Panel>
            </div>
          )}
          {providerPage === "overview" && (
            <div className="dashboard-overview-grid mt-6 grid gap-5 xl:grid-cols-2">
              <Panel title="Work waiting for you">
                <div className="grid gap-3">
                  <button
                    type="button"
                    onClick={() => setProviderPage("requests")}
                    className="dashboard-list-row"
                  >
                    <span>
                      <strong>New client requests</strong>
                      <small>Accept or review incoming work</small>
                    </span>
                    <strong>{providerRequests.length}</strong>
                  </button>
                  <button
                    type="button"
                    onClick={() => setProviderPage("jobs")}
                    className="dashboard-list-row"
                  >
                    <span>
                      <strong>Active service jobs</strong>
                      <small>Travel, estimate and complete jobs</small>
                    </span>
                    <strong>{confirmedJobs.length}</strong>
                  </button>
                  <button
                    type="button"
                    onClick={() => setProviderPage("earnings")}
                    className="dashboard-list-row"
                  >
                    <span>
                      <strong>Available to withdraw</strong>
                      <small>Open earnings and payout controls</small>
                    </span>
                    <strong>
                      {formatMoney(earningsSummary.availableToWithdraw || 0)}
                    </strong>
                  </button>
                </div>
              </Panel>
              <Panel title="Client history">
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-slate-50 p-4 dark:bg-white/5">
                  <div>
                    <p className="text-sm font-black text-slate-950 dark:text-white">
                      {historyJobs.length} history record
                      {historyJobs.length === 1 ? "" : "s"}
                    </p>
                    <p className="mt-1 text-xs font-bold text-slate-500 dark:text-slate-300">
                      Open the full page to review every completed and cancelled
                      client job.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setHistoryPageOpen(true)}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-black text-white shadow-lg shadow-slate-950/10 transition hover:-translate-y-0.5 dark:bg-amber-300 dark:text-slate-950"
                  >
                    Open all history <ArrowRight size={17} />
                  </button>
                </div>
              </Panel>
            </div>
          )}
        </div>
        {isDashboardLocked && (
          <div className="absolute inset-x-0 top-6 z-20 flex justify-center px-4">
            <div className="w-full max-w-2xl rounded-[1.75rem] border border-amber-200 bg-white/95 p-6 text-center text-slate-950 shadow-2xl shadow-slate-950/15 backdrop-blur-xl dark:border-amber-300/30 dark:bg-slate-900/95 dark:text-white">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-amber-100 text-amber-700 dark:bg-amber-300/15 dark:text-amber-200">
                <Clock size={25} />
              </div>
              <p className="mt-4 text-sm font-black uppercase tracking-[0.18em] text-amber-700 dark:text-amber-200">
                {approvalStatus}
              </p>
              <h2 className="mt-2 text-2xl font-black">{approvalTitle}</h2>
              <p className="mx-auto mt-3 max-w-xl text-sm font-semibold leading-6 text-slate-600 dark:text-slate-300">
                {approvalCopy}
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-3">
                <button
                  type="button"
                  onClick={refreshDashboard}
                  className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white shadow-lg shadow-slate-950/10 dark:bg-amber-300 dark:text-slate-950"
                >
                  Check approval status
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      <AnimatePresence>
        {!isDashboardLocked && cancelTargetBooking && (
          <ProviderCancelModal
            booking={cancelTargetBooking}
            onClose={() => setCancelTargetBooking(null)}
            onSubmit={async (reason) => {
              const updated = await updateProviderBookingStatus(
                cancelTargetBooking._id,
                "cancelled",
                reason,
              );
              if (updated) setCancelTargetBooking(null);
            }}
          />
        )}
        {!isDashboardLocked && rejectTargetBooking && (
          <ProviderRejectModal
            booking={rejectTargetBooking}
            onClose={() => setRejectTargetBooking(null)}
            onSubmit={async (reason) => {
              const updated = await rejectProviderRequest(
                rejectTargetBooking._id,
                reason,
              );
              if (updated) setRejectTargetBooking(null);
            }}
          />
        )}
        {!isDashboardLocked && estimateTargetBooking && (
          <ProviderEstimateModal
            booking={estimateTargetBooking}
            onClose={() => setEstimateTargetBooking(null)}
            onSubmit={async (amount) => {
              await submitEstimate(estimateTargetBooking._id, amount);
              setEstimateTargetBooking(null);
            }}
          />
        )}
        {!isDashboardLocked && withdrawOpen && (
          <ProviderWithdrawModal
            availableAmount={earningsSummary.availableToWithdraw || 0}
            onClose={() => setWithdrawOpen(false)}
            onSubmit={async (bankDetails) => {
              const data = await withdrawProviderEarnings(bankDetails);
              setStatusMessage(data.message || "Withdrawal completed.");
              setWithdrawOpen(false);
              await refreshDashboard();
            }}
          />
        )}
      </AnimatePresence>
    </DashboardShell>
  );
}

function ProviderClientHistoryPage({
  historyJobs,
  notifications,
  refreshDashboard,
  onBack,
  sidebarItems,
  onProfile,
  onLogout,
}) {
  const completedCount = historyJobs.filter(
    (booking) => booking.status === "completed",
  ).length;
  const cancelledCount = historyJobs.filter((booking) =>
    ["cancelled", "rejected"].includes(booking.status),
  ).length;

  return (
    <DashboardShell
      title="Client History"
      subtitle="All completed and cancelled client jobs for your provider account."
      notifications={notifications}
      variant="provider"
      sidebarItems={sidebarItems}
      onProfile={onProfile}
      onLogout={onLogout}
      headerActions={
        <>
          <button
            type="button"
            onClick={onBack}
            className="rounded-full bg-slate-100 px-5 py-3 text-sm font-black text-slate-800 transition hover:bg-slate-200 dark:bg-white/10 dark:text-white dark:hover:bg-white/15"
          >
            Back to dashboard
          </button>
          <button
            type="button"
            onClick={refreshDashboard}
            className="rounded-full bg-slate-950 px-5 py-3 text-sm font-black text-white shadow-lg shadow-slate-950/10 transition hover:-translate-y-0.5 dark:bg-amber-300 dark:text-slate-950"
          >
            Refresh
          </button>
        </>
      }
    >
      <div className="grid gap-5 md:grid-cols-3">
        <StatCard
          icon={BriefcaseBusiness}
          label="History records"
          value={historyJobs.length}
        />
        <StatCard
          icon={CheckCircle}
          label="Completed jobs"
          value={completedCount}
        />
        <StatCard
          icon={XCircle}
          label="Cancelled / Rejected"
          value={cancelledCount}
        />
      </div>
      <div className="mt-8">
        <Panel title="All client history">
          <div className="grid gap-4 lg:grid-cols-2">
            {historyJobs.length ? (
              historyJobs.map((booking) => (
                <JobCard key={booking._id} booking={booking} />
              ))
            ) : (
              <EmptyState
                title="No completed or cancelled jobs yet"
                copy="Finished and cancelled jobs will appear here as history."
              />
            )}
          </div>
        </Panel>
      </div>
    </DashboardShell>
  );
}

function ProviderApprovalWaitCard({
  approvalStatus,
  approvalTitle,
  approvalCopy,
  providerProfile,
  refreshDashboard,
  setStatusMessage,
}) {
  const [resubmitOpen, setResubmitOpen] = useState(false);
  const isRejected = approvalStatus === "rejected";

  return (
    <section className="mx-auto mt-8 grid min-h-[52vh] max-w-3xl place-items-center rounded-[2rem] border border-amber-200 bg-white p-6 text-center text-slate-950 shadow-xl shadow-slate-950/10 dark:border-amber-300/30 dark:bg-white/5 dark:text-white sm:p-10 dark:bg-none dark:bg-[#081229]">
      <div className="w-full">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-amber-100 text-amber-700 dark:bg-amber-300/15 dark:text-amber-200">
          <Clock size={30} />
        </div>
        <p className="mt-5 text-sm font-black uppercase tracking-[0.18em] text-amber-700 dark:text-amber-200">
          {approvalStatus}
        </p>
        <h2 className="mt-3 text-3xl font-black tracking-tight">
          {approvalTitle}
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-base font-semibold leading-7 text-slate-600 dark:text-slate-300">
          {approvalCopy}
        </p>
        <div className="mx-auto mt-5 grid max-w-xl gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left dark:border-white/10 dark:bg-white/5">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
              Aadhaar verification
            </span>
            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-black uppercase text-amber-700 dark:bg-amber-300/15 dark:text-amber-200">
              {providerProfile?.verificationStatus || "pending"}
            </span>
          </div>
          <p className="text-sm font-bold text-slate-600 dark:text-slate-300">
            Aadhaar: {providerProfile?.aadhaarNumberMasked || "Not uploaded"}
          </p>
          {providerProfile?.verificationRejectedReason && (
            <p className="rounded-xl bg-rose-50 p-3 text-sm font-bold text-rose-700 dark:bg-rose-400/10 dark:text-rose-200">
              {providerProfile.verificationRejectedReason}
            </p>
          )}
        </div>

        {isRejected && !resubmitOpen && (
          <div className="mx-auto mt-4 flex max-w-xl flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={refreshDashboard}
              className="rounded-2xl bg-slate-950 px-6 py-4 text-sm font-black text-white shadow-lg shadow-slate-950/10 transition hover:-translate-y-0.5 dark:bg-amber-300 dark:text-slate-950"
            >
              Check approval status
            </button>
            <button
              type="button"
              onClick={() => setResubmitOpen(true)}
              className="rounded-2xl border-2 border-amber-600 px-6 py-4 text-sm font-black text-amber-700 transition hover:-translate-y-0.5 dark:border-amber-300 dark:text-amber-200"
            >
              Fix details &amp; resubmit
            </button>
          </div>
        )}

        {isRejected && resubmitOpen && (
          <ProviderResubmitVerification
            providerProfile={providerProfile}
            onCancel={() => setResubmitOpen(false)}
            onSuccess={() => {
              setResubmitOpen(false);
              refreshDashboard?.();
            }}
            setStatusMessage={setStatusMessage}
          />
        )}

        {!isRejected && (
          <button
            type="button"
            onClick={refreshDashboard}
            className="mt-7 rounded-2xl bg-slate-950 px-6 py-4 text-sm font-black text-white shadow-lg shadow-slate-950/10 transition hover:-translate-y-0.5 dark:bg-amber-300 dark:text-slate-950"
          >
            Check approval status
          </button>
        )}
      </div>
    </section>
  );
}

function ProviderResubmitField({
  label,
  hint,
  accept,
  value,
  fileName,
  onChange,
  onRemove,
  required = false,
  isDocument = false,
}) {
  return (
    <div className="text-left">
      <span className="mb-1.5 flex items-center gap-1.5 text-xs font-black uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
        {label}
        {required && (
          <em className="text-rose-600 dark:text-rose-300">Required</em>
        )}
      </span>
      <label
        className={`flex cursor-pointer items-center gap-3 rounded-2xl border-2 border-dashed p-3 transition ${
          value
            ? "border-emerald-400 bg-emerald-50 dark:border-emerald-300/40 dark:bg-emerald-400/10"
            : "border-slate-300 bg-white hover:border-amber-400 dark:border-white/15 dark:bg-white/5"
        }`}
      >
        <input
          type="file"
          accept={accept}
          onChange={onChange}
          className="hidden"
        />
        <span className="grid h-10 w-10 flex-none place-items-center rounded-xl bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-slate-300">
          <UploadCloud size={18} />
        </span>
        <span className="min-w-0 flex-1">
          <strong className="block truncate text-sm font-bold text-slate-900 dark:text-white">
            {value ? fileName || "File selected" : "Choose file"}
          </strong>
          <small className="block truncate text-xs font-semibold text-slate-500 dark:text-slate-400">
            {value ? "Ready to upload" : hint}
          </small>
        </span>
        {value && (
          <CheckCircle
            className="flex-none text-emerald-600 dark:text-emerald-300"
            size={18}
          />
        )}
      </label>
      {value && (
        <button
          type="button"
          onClick={onRemove}
          className="mt-1.5 flex items-center gap-1 text-xs font-bold text-rose-600 hover:underline dark:text-rose-300"
        >
          <Trash2 size={12} /> Remove
        </button>
      )}
      {!isDocument && value && (
        <img
          src={value}
          alt=""
          className="mt-2 h-16 w-16 rounded-lg border border-slate-200 object-cover dark:border-white/10"
        />
      )}
    </div>
  );
}

function ProviderResubmitVerification({
  providerProfile,
  onCancel,
  onSuccess,
  setStatusMessage,
}) {
  const [form, setForm] = useState({
    name: providerProfile?.name || "",
    category: providerProfile?.category || "",
    customCategory: providerProfile?.customCategory || "",
    location: providerProfile?.location || "",
    preferredWorkLocation: providerProfile?.preferredWorkLocation || "",
    phone: providerProfile?.phone || "",
    price: providerProfile?.price || "",
    aadhaarNumber: "",
    aadhaarFrontUrl: "",
    aadhaarDocumentName: "",
    aadhaarBackUrl: "",
    aadhaarBackDocumentName: "",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const readDocument = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () =>
        reject(new Error("Selected file could not be read."));
      reader.readAsDataURL(file);
    });

  const handleAadhaarChange = (field, nameField) => async (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      setForm((prev) => ({ ...prev, [field]: "", [nameField]: "" }));
      return;
    }

    const allowedTypes = [
      "image/png",
      "image/jpeg",
      "image/jpg",
      "image/webp",
      "application/pdf",
    ];
    if (!allowedTypes.includes(file.type)) {
      setError("Upload Aadhaar as PNG, JPG, WEBP, or PDF.");
      event.target.value = "";
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      setError("Aadhaar document must be under 4MB.");
      event.target.value = "";
      return;
    }

    try {
      const dataUrl = await readDocument(file);
      setError("");
      setForm((prev) => ({
        ...prev,
        [field]: dataUrl,
        [nameField]: file.name,
      }));
    } catch (readError) {
      setError(readError.message || "Aadhaar document could not be prepared.");
      event.target.value = "";
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    const aadhaarDigits = form.aadhaarNumber.replace(/\D/g, "");
    if (aadhaarDigits.length !== 12) {
      setError("Enter a valid 12-digit Aadhaar number.");
      return;
    }
    if (!form.aadhaarFrontUrl) {
      setError("Upload Aadhaar front image or PDF before resubmitting.");
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem("servicehub_token");
      const response = await authenticatedFetch(
        `${API_URL}/providers/resubmit-verification`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: form.name,
            category: form.category,
            customCategory: form.customCategory,
            location: form.location,
            preferredWorkLocation: form.preferredWorkLocation,
            phone: form.phone,
            price: form.price,
            aadhaarNumber: aadhaarDigits,
            aadhaarFrontUrl: form.aadhaarFrontUrl,
            aadhaarDocumentName: form.aadhaarDocumentName,
            aadhaarBackUrl: form.aadhaarBackUrl,
            aadhaarBackDocumentName: form.aadhaarBackDocumentName,
          }),
        },
      );
      const data = await parseApiResponse(
        response,
        "Registration could not be resubmitted.",
      );
      if (!response.ok) {
        throw new Error(
          data.message || "Registration could not be resubmitted.",
        );
      }
      setStatusMessage?.(
        data.message ||
          "Your registration has been resubmitted and is now waiting for admin review.",
      );
      onSuccess?.();
    } catch (submitError) {
      setError(
        submitError.message ||
          "Registration could not be resubmitted. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto mt-5 grid max-w-xl gap-4 rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm dark:border-white/10 dark:bg-white/5"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-base font-black text-slate-900 dark:text-white">
          Resubmit your registration
        </h3>
        <button
          type="button"
          onClick={onCancel}
          className="grid h-8 w-8 place-items-center rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10"
        >
          <X size={16} />
        </button>
      </div>
      <p className="-mt-2 text-sm font-semibold text-slate-600 dark:text-slate-300">
        Update what admin flagged (most often the Aadhaar upload) and send your
        profile back for review. You don&apos;t need to create a new account.
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-left text-xs font-black uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
          Business / provider name
          <input
            type="text"
            value={form.name}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, name: event.target.value }))
            }
            className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none focus:border-amber-500 dark:border-white/15 dark:bg-white/10 dark:text-white"
            required
          />
        </label>
        <label className="text-left text-xs font-black uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
          Phone
          <input
            type="tel"
            value={form.phone}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, phone: event.target.value }))
            }
            className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none focus:border-amber-500 dark:border-white/15 dark:bg-white/10 dark:text-white"
            required
          />
        </label>
        <label className="text-left text-xs font-black uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
          Service category
          <input
            type="text"
            value={form.category}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, category: event.target.value }))
            }
            className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none focus:border-amber-500 dark:border-white/15 dark:bg-white/10 dark:text-white"
            required
          />
        </label>
        <label className="text-left text-xs font-black uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
          Location
          <input
            type="text"
            value={form.location}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, location: event.target.value }))
            }
            className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none focus:border-amber-500 dark:border-white/15 dark:bg-white/10 dark:text-white"
            required
          />
        </label>
        <label className="text-left text-xs font-black uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
          Preferred work location
          <input
            type="text"
            value={form.preferredWorkLocation}
            onChange={(event) =>
              setForm((prev) => ({
                ...prev,
                preferredWorkLocation: event.target.value,
              }))
            }
            className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none focus:border-amber-500 dark:border-white/15 dark:bg-white/10 dark:text-white"
          />
        </label>
        <label className="text-left text-xs font-black uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
          Price
          <input
            type="text"
            value={form.price}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, price: event.target.value }))
            }
            className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none focus:border-amber-500 dark:border-white/15 dark:bg-white/10 dark:text-white"
          />
        </label>
      </div>

      <label className="text-left text-xs font-black uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
        Aadhaar number
        <input
          type="text"
          inputMode="numeric"
          maxLength="14"
          value={form.aadhaarNumber}
          onChange={(event) => {
            const digits = event.target.value.replace(/\D/g, "").slice(0, 12);
            const formatted = digits.replace(/(\d{4})(?=\d)/g, "$1 ");
            setForm((prev) => ({ ...prev, aadhaarNumber: formatted }));
          }}
          placeholder="XXXX XXXX 1234"
          className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none focus:border-amber-500 dark:border-white/15 dark:bg-white/10 dark:text-white"
          required
        />
      </label>

      <div className="grid gap-3 sm:grid-cols-2">
        <ProviderResubmitField
          label="Aadhaar front or PDF"
          hint="Image or PDF up to 4MB"
          accept="image/png,image/jpeg,image/jpg,image/webp,application/pdf"
          value={form.aadhaarFrontUrl}
          fileName={form.aadhaarDocumentName}
          onChange={handleAadhaarChange(
            "aadhaarFrontUrl",
            "aadhaarDocumentName",
          )}
          onRemove={() =>
            setForm((prev) => ({
              ...prev,
              aadhaarFrontUrl: "",
              aadhaarDocumentName: "",
            }))
          }
          required
          isDocument={form.aadhaarDocumentName?.toLowerCase().endsWith(".pdf")}
        />
        <ProviderResubmitField
          label="Aadhaar back"
          hint="Optional with a complete Aadhaar PDF"
          accept="image/png,image/jpeg,image/jpg,image/webp"
          value={form.aadhaarBackUrl}
          fileName={form.aadhaarBackDocumentName}
          onChange={handleAadhaarChange(
            "aadhaarBackUrl",
            "aadhaarBackDocumentName",
          )}
          onRemove={() =>
            setForm((prev) => ({
              ...prev,
              aadhaarBackUrl: "",
              aadhaarBackDocumentName: "",
            }))
          }
        />
      </div>

      {error && (
        <p className="rounded-xl bg-rose-50 p-3 text-sm font-bold text-rose-700 dark:bg-rose-400/10 dark:text-rose-200">
          {error}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-end gap-3 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl px-5 py-3 text-sm font-black text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/10"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="rounded-xl bg-amber-600 px-6 py-3 text-sm font-black text-white shadow-lg shadow-amber-600/20 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Resubmitting..." : "Resubmit for review"}
        </button>
      </div>
    </form>
  );
}

function ProviderWithdrawCard({
  earningsSummary,
  providerProfile,
  onWithdrawClick,
}) {
  const totalPaid =
    earningsSummary.totalPaidEarnings || providerProfile?.paidEarnings || 0;
  const available = earningsSummary.availableToWithdraw || 0;
  const adminReleased = earningsSummary.adminReleasedAmount || 0;
  const withdrawn = earningsSummary.withdrawnAmount || 0;

  return (
    <div className="rounded-[1.7rem] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-xl dark:border-white/10 dark:bg-white/5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-black text-slate-500 dark:text-slate-300">
            Total Paid Earnings
          </p>
          <p className="mt-3 text-2xl font-black tracking-tight text-slate-950 dark:text-white">
            {formatMoney(totalPaid)}
          </p>
        </div>
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-teal-50 text-teal-700 dark:bg-teal-400/10 dark:text-teal-200">
          <Wallet size={21} />
        </div>
      </div>
      <div className="mt-4 grid gap-2 text-sm font-bold text-slate-500 dark:text-slate-300">
        <p>
          Admin released:{" "}
          <span className="font-black text-slate-950 dark:text-white">
            {formatMoney(adminReleased)}
          </span>
        </p>
        <p>
          Already withdrawn:{" "}
          <span className="font-black text-slate-950 dark:text-white">
            {formatMoney(withdrawn)}
          </span>
        </p>
        <p>
          Available to withdraw:{" "}
          <span className="font-black text-emerald-700 dark:text-emerald-100">
            {formatMoney(available)}
          </span>
        </p>
      </div>
      <button
        type="button"
        onClick={onWithdrawClick}
        disabled={available <= 0}
        className="mt-4 w-full rounded-2xl bg-gradient-to-r from-teal-600 to-blue-600 px-4 py-3 text-sm font-black text-white shadow-lg shadow-blue-600/15 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-55"
      >
        {available > 0
          ? "Withdraw to bank account"
          : "Waiting for admin payout"}
      </button>
    </div>
  );
}

function ProviderWithdrawModal({ availableAmount, onClose, onSubmit }) {
  const [form, setForm] = useState({
    accountHolder: "",
    bankName: "",
    accountNumber: "",
    ifscCode: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const update = (field) => (event) =>
    setForm((current) => ({ ...current, [field]: event.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit(form);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div
      className="fixed inset-0 z-[85] grid place-items-center bg-slate-950/70 p-4 backdrop-blur"
      onClick={onClose}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.form
        onSubmit={submit}
        onClick={(event) => event.stopPropagation()}
        initial={{ opacity: 0, y: 24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 18, scale: 0.97 }}
        className="w-full max-w-xl rounded-[2rem] bg-white p-6 text-slate-950 shadow-2xl dark:bg-slate-900 dark:text-white"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.16em] text-teal-700 dark:text-teal-200">
              Withdraw earnings
            </p>
            <h2 className="mt-2 text-2xl font-black">
              Send {formatMoney(availableAmount)} to bank
            </h2>
            <p className="mt-2 text-sm font-semibold text-slate-500 dark:text-slate-300">
              Enter your bank details to withdraw the amount released by admin.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-10 w-10 place-items-center rounded-full bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-white"
          >
            <X size={18} />
          </button>
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <FormInput
            label="Account holder"
            value={form.accountHolder}
            onChange={update("accountHolder")}
            placeholder="Full name"
          />
          <FormInput
            label="Bank name"
            value={form.bankName}
            onChange={update("bankName")}
            placeholder="Bank name"
          />
          <FormInput
            label="Account number"
            value={form.accountNumber}
            onChange={update("accountNumber")}
            placeholder="Account number"
          />
          <FormInput
            label="IFSC code"
            value={form.ifscCode}
            onChange={update("ifscCode")}
            placeholder="Example: SBIN0001234"
          />
        </div>
        <button
          type="submit"
          disabled={submitting || availableAmount <= 0}
          className="mt-6 w-full rounded-2xl bg-slate-950 px-6 py-4 font-black text-white shadow-lg shadow-slate-950/10 disabled:cursor-not-allowed disabled:opacity-55 dark:bg-amber-300 dark:text-slate-950"
        >
          {submitting
            ? "Withdrawing..."
            : `Withdraw ${formatMoney(availableAmount)}`}
        </button>
      </motion.form>
    </motion.div>
  );
}

function BookingModal({
  bookingForm,
  setBookingForm,
  submitBooking,
  close,
  categories,
  user,
}) {
  const addressFieldRef = useRef(null);
  const update = (field) => (event) =>
    setBookingForm((current) => ({ ...current, [field]: event.target.value }));
  const hasSelectedProviderService = Boolean(
    bookingForm.providerId && bookingForm.service,
  );
  const registeredAddress = String(user?.address || "").trim();
  const useRegisteredAddress = () => {
    if (!registeredAddress) return;
    setBookingForm((current) => ({ ...current, address: registeredAddress }));
    window.setTimeout(() => addressFieldRef.current?.focus(), 0);
  };
  const today = getTodayInputDate();
  const updateDate = (event) => {
    const value = event.target.value;
    setBookingForm((current) => ({
      ...current,
      date: value && value < today ? today : value,
    }));
  };
  const durationField = parseDurationValue(bookingForm.duration);
  const updateDuration = (next = {}) => {
    setBookingForm((current) => {
      const currentDuration = parseDurationValue(current.duration);
      return {
        ...current,
        duration: buildDurationValue(
          next.amount ?? currentDuration.amount,
          next.unit ?? currentDuration.unit,
        ),
      };
    });
  };
  return (
    <motion.div
      className="fixed inset-0 z-[70] grid place-items-center bg-slate-950/70 p-4 backdrop-blur"
      onClick={close}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.55, ease: "easeOut" }}
    >
      <motion.form
        onSubmit={submitBooking}
        onClick={(event) => event.stopPropagation()}
        className="scrollbar-hidden relative max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-[2rem] border border-slate-200 bg-white p-6 text-slate-950 shadow-2xl dark:border-white/10 dark:bg-[#081229] dark:text-white"
        initial={{ opacity: 0, y: 28, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 18, scale: 0.97 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      >
        <button
          type="button"
          onClick={close}
          className="absolute right-5 top-5 grid h-10 w-10 place-items-center rounded-full bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-white"
        >
          <X size={18} />
        </button>
        <p className="font-black text-amber-600">Service booking</p>
        <h2 className="mt-2 text-3xl font-black">Schedule your next job</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <FormInput
            label="Name"
            value={bookingForm.name}
            onChange={update("name")}
            placeholder="Your name"
          />
          <FormInput
            label="Phone"
            value={bookingForm.phone}
            onChange={update("phone")}
            placeholder="Mobile number"
          />
          <label className="grid gap-2 font-bold">
            Service
            {hasSelectedProviderService ? (
              <input
                type="text"
                value={bookingForm.service}
                readOnly
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-950 outline-none dark:border-white/10 dark:bg-slate-900 dark:text-white"
              />
            ) : (
              <select
                value={bookingForm.service}
                onChange={update("service")}
                required
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-amber-300 dark:border-white/10 dark:bg-slate-900 dark:text-white"
              >
                <option value="">Choose service</option>
                {categories
                  .filter((category) => category !== "All")
                  .map((category) => (
                    <option key={category}>{category}</option>
                  ))}
              </select>
            )}
          </label>
          <FormInput
            label="Date"
            type="date"
            value={bookingForm.date}
            onChange={updateDate}
            min={today}
          />
          <FormInput
            label="Time"
            type="time"
            value={bookingForm.time}
            onChange={update("time")}
          />
          <fieldset className="grid gap-2">
            <legend className="font-bold">Duration</legend>
            <div className="flex overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-950 transition focus-within:border-amber-300 dark:border-white/10 dark:bg-slate-900 dark:text-white">
              <span className="grid w-12 place-items-center border-r border-slate-200 text-slate-500 dark:border-white/10 dark:text-slate-300">
                <Clock size={19} />
              </span>
              <input
                type="number"
                min="1"
                max="99"
                value={durationField.amount}
                onChange={(event) =>
                  updateDuration({ amount: event.target.value })
                }
                className="min-w-0 flex-1 bg-transparent px-4 py-3 font-black outline-none"
                aria-label="Duration amount"
              />
              <select
                value={durationField.unit}
                onChange={(event) =>
                  updateDuration({ unit: event.target.value })
                }
                className="border-l border-slate-200 bg-slate-50 px-4 py-3 font-black text-slate-700 outline-none dark:border-white/10 dark:bg-white/5 dark:text-white"
                aria-label="Duration unit"
              >
                <option value="min">min</option>
                <option value="hours">hour</option>
                <option value="days">day</option>
              </select>
            </div>
          </fieldset>
          <label className="grid gap-2 font-bold md:col-span-2">
            <span className="flex flex-wrap items-center justify-between gap-3">
              <span>Address</span>
              {registeredAddress && (
                <button
                  type="button"
                  onClick={useRegisteredAddress}
                  className="min-h-0 rounded-full border border-teal-200 bg-teal-50 px-3 py-1.5 text-xs font-black text-teal-700 transition hover:bg-teal-100 dark:border-teal-300/25 dark:bg-teal-300/10 dark:text-teal-100"
                >
                  Use registered address
                </button>
              )}
            </span>
            <textarea
              ref={addressFieldRef}
              value={bookingForm.address}
              onChange={update("address")}
              placeholder={
                registeredAddress
                  ? "Type address or use your registered address"
                  : "Service address"
              }
              rows="4"
              required
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-amber-300 dark:border-white/10 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-500"
            />
          </label>
          <label className="grid gap-2 font-bold md:col-span-2">
            Describe the problem
            <textarea
              value={bookingForm.problemDescription}
              onChange={update("problemDescription")}
              placeholder="Tell us what issue you are facing"
              rows="4"
              required
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-amber-300 dark:border-white/10 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-500"
            />
          </label>
        </div>
        <button className="mt-6 rounded-2xl bg-slate-950 px-6 py-4 font-black text-white dark:bg-amber-300 dark:text-slate-950">
          Confirm booking & notify provider
        </button>
      </motion.form>
    </motion.div>
  );
}

function ProviderAccountDetailsModal({ form, provider, onUpdate, onClose }) {
  const approval = provider?.approvalStatus || "pending";
  const activeStatus = provider?.isActive === false ? "Inactive" : "Active";
  const info = [
    ["Email", "Official", form.email, Mail],
    ["Phone number", "Mobile", form.phone, Phone],
    ["Service category", "Provider type", form.category, BriefcaseBusiness],
    ["Location", "Service area", form.location, MapPin],
    ["Pricing", "Starting price", form.price, IndianRupee],
    ["Response time", "Average reply", form.responseTime, CalendarCheck],
  ];
  const bank = form.bankDetails || {};
  const features = form.features
    ? form.features
        .split(",")
        .map((feature) => feature.trim())
        .filter(Boolean)
    : [];

  return (
    <div className="fixed inset-0 z-[75] grid place-items-center bg-slate-950/60 p-3 backdrop-blur-sm sm:p-4">
      <div className="scrollbar-hidden relative max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-[2rem] bg-white shadow-2xl dark:bg-slate-900">
        <div className="border-b border-slate-100 bg-gradient-to-br from-slate-50 via-white to-amber-50/60 px-5 pb-5 pt-5 dark:border-white/10 dark:from-white/5 dark:via-slate-900 dark:to-white/5 sm:px-6">
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="grid h-10 w-10 place-items-center rounded-full bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-white"
            >
              <X size={18} />
            </button>
            <p className="text-sm font-black uppercase tracking-[0.16em] text-slate-400">
              Provider details
            </p>
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-[0_18px_45px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-slate-900">
            <div className="grid h-16 w-16 flex-none place-items-center rounded-2xl bg-gradient-to-br from-teal-600 to-blue-600 text-2xl font-black text-white shadow-lg shadow-blue-600/20">
              {(form.name || "P").slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-2xl font-black tracking-[-0.03em] text-slate-950 dark:text-white sm:text-3xl">
                  {form.name || "Provider profile"}
                </h2>
                <button
                  type="button"
                  onClick={onUpdate}
                  className="ml-auto rounded-full bg-slate-950 px-4 py-2 text-sm font-black text-white shadow-lg shadow-slate-950/10 transition hover:-translate-y-0.5 dark:bg-amber-300 dark:text-slate-950"
                >
                  Edit
                </button>
              </div>
              <p className="mt-1 text-sm font-bold text-slate-500 dark:text-slate-300">
                {form.category || "Service provider"}
              </p>
            </div>
          </div>
        </div>

        <div className="px-5 py-6 sm:px-6">
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-white/5">
            {info.map(([label, subLabel, value, Icon]) => (
              <div
                key={label}
                className="flex gap-4 border-b border-slate-100 px-5 py-5 transition hover:bg-slate-50 last:border-b-0 dark:border-white/10 dark:hover:bg-white/5"
              >
                <span className="mt-1 grid h-10 w-10 flex-none place-items-center rounded-2xl bg-amber-50 text-amber-600 shadow-sm dark:bg-amber-300/15 dark:text-amber-300">
                  <Icon size={19} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-lg font-black text-slate-950 dark:text-white">
                    {label}
                  </p>
                  <p className="mt-3 text-sm font-bold text-slate-400">
                    {subLabel}
                  </p>
                  <p className="mt-1 break-words text-base font-black text-slate-700 dark:text-slate-200">
                    {value || "Not added"}
                  </p>
                </div>
              </div>
            ))}
            <div className="flex gap-4 border-b border-slate-100 px-5 py-5 transition hover:bg-slate-50 dark:border-white/10 dark:hover:bg-white/5">
              <span className="mt-1 grid h-10 w-10 flex-none place-items-center rounded-2xl bg-emerald-50 text-emerald-600 shadow-sm dark:bg-emerald-300/15 dark:text-emerald-300">
                <ShieldCheck size={19} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-lg font-black text-slate-950 dark:text-white">
                  Provider status
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-sm font-black text-emerald-700">
                    {activeStatus}
                  </span>
                  <span className="rounded-full bg-violet-50 px-3 py-1.5 text-sm font-black capitalize text-[#5a45d6]">
                    {approval}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex gap-4 px-5 py-5 transition hover:bg-slate-50 dark:hover:bg-white/5">
              <span className="mt-1 grid h-10 w-10 flex-none place-items-center rounded-2xl bg-teal-50 text-teal-700 shadow-sm dark:bg-teal-300/15 dark:text-teal-300">
                <Star size={19} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-lg font-black text-slate-950 dark:text-white">
                  What's included
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(features.length ? features : ["Not added"]).map(
                    (feature) => (
                      <span
                        key={feature}
                        className="rounded-full bg-slate-100 px-3 py-2 text-sm font-black text-slate-700 dark:bg-white/10 dark:text-white"
                      >
                        {feature}
                      </span>
                    ),
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="mt-5 rounded-3xl border border-slate-200 bg-slate-50 p-5 shadow-sm dark:border-white/10 dark:bg-white/5">
            <p className="text-sm font-black uppercase tracking-[0.14em] text-slate-400">
              About
            </p>
            <p className="mt-2 leading-7 text-slate-600 dark:text-slate-300">
              {form.about ||
                "Add your experience, service style, and what clients can expect."}
            </p>
          </div>
          <div className="mt-5 rounded-3xl border border-slate-200 bg-slate-50 p-5 shadow-sm dark:border-white/10 dark:bg-white/5">
            <p className="text-sm font-black uppercase tracking-[0.14em] text-slate-400">
              Bank payout account
            </p>
            <div className="mt-3 grid gap-2 text-sm font-bold text-slate-600 dark:text-slate-300 sm:grid-cols-2">
              <span>Account holder: {bank.accountHolder || "Not added"}</span>
              <span>Bank: {bank.bankName || "Not added"}</span>
              <span>
                Account:{" "}
                {bank.accountNumber
                  ? `****${String(bank.accountNumber).slice(-4)}`
                  : "Not added"}
              </span>
              <span>IFSC: {bank.ifscCode || "Not added"}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProviderAccountEditModal({
  form,
  setForm,
  categories,
  onSubmit,
  onClose,
}) {
  const update = (field) => (event) =>
    setForm((current) => ({ ...current, [field]: event.target.value }));
  const updateBank = (field) => (event) =>
    setForm((current) => ({
      ...current,
      bankDetails: {
        ...(current.bankDetails || {}),
        [field]: event.target.value,
      },
    }));
  const serviceCategories = categories.filter((category) => category !== "All");

  return (
    <div className="fixed inset-0 z-[80] grid place-items-center bg-slate-950/70 p-3 backdrop-blur sm:p-4">
      <form
        onSubmit={onSubmit}
        className="scrollbar-hidden relative max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-[2rem] bg-[#fbfaf6] shadow-2xl dark:bg-slate-900"
      >
        <div className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 px-5 py-5 backdrop-blur dark:border-white/10 dark:bg-slate-900/95 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-teal-600 to-blue-600 text-lg font-black text-white shadow-lg shadow-blue-600/20">
                {(form.name || "P").slice(0, 1).toUpperCase()}
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-amber-600">
                  Provider account
                </p>
                <h2 className="text-2xl font-black tracking-[-0.03em] text-slate-950 dark:text-white">
                  Edit service profile
                </h2>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="grid h-10 w-10 place-items-center rounded-full bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-white"
            >
              <X size={18} />
            </button>
          </div>
          <p className="mt-3 max-w-2xl text-sm text-slate-500 dark:text-slate-300">
            Update the details clients and admins see for your provider account.
          </p>
        </div>

        <div className="grid gap-5 p-5 sm:p-6">
          <section className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/5 dark:bg-none dark:bg-[#081229] dark:text-white">
            <h3 className="text-lg font-black text-slate-950 dark:text-white">
              Business details
            </h3>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <FormInput
                label="Business name"
                value={form.name}
                onChange={update("name")}
                placeholder="Your service profile name"
              />
              <label className="grid gap-2 font-bold">
                Service category
                <select
                  value={form.category}
                  onChange={update("category")}
                  required
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-white/10 dark:bg-[#081229]"
                >
                  <option value="">Choose service category</option>
                  {serviceCategories.map((category) => (
                    <option key={category}>{category}</option>
                  ))}
                </select>
              </label>
              <FormInput
                label="Location"
                value={form.location}
                onChange={update("location")}
                placeholder="City or service area"
              />
              <FormInput
                label="Phone"
                value={form.phone}
                onChange={update("phone")}
                placeholder="Mobile number"
              />
              <FormInput
                label="Email"
                type="email"
                value={form.email}
                onChange={update("email")}
                placeholder="provider@example.com"
              />
            </div>
          </section>

          <section className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/5 dark:bg-none dark:bg-[#081229] dark:text-white">
            <h3 className="text-lg font-black text-slate-950 dark:text-white">
              Service details
            </h3>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <FormInput
                label="Pricing"
                value={form.price}
                onChange={update("price")}
                placeholder="From Rs. 299"
              />
              <FormInput
                label="Response time"
                value={form.responseTime}
                onChange={update("responseTime")}
                placeholder="~1 hr"
              />
              <FormInput
                label="What's included"
                value={form.features}
                onChange={update("features")}
                placeholder="Repair, installation, inspection"
              />
              <label className="grid gap-2 font-bold md:col-span-2">
                Short description
                <textarea
                  value={form.description}
                  onChange={update("description")}
                  placeholder="Describe your service for clients"
                  rows="3"
                  required
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-amber-300 dark:border-white/10 dark:bg-[#081229]"
                />
              </label>
              <label className="grid gap-2 font-bold md:col-span-2">
                About provider
                <textarea
                  value={form.about}
                  onChange={update("about")}
                  placeholder="Tell clients about your experience and work style"
                  rows="4"
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-amber-300 dark:border-white/10 dark:bg-[#081229]"
                />
              </label>
            </div>
          </section>

          <section className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/5 dark:bg-none dark:bg-[#081229] dark:text-white">
            <h3 className="text-lg font-black text-slate-950 dark:text-white">
              Bank details for payouts
            </h3>
            <p className="mt-1 text-sm font-semibold text-slate-500 dark:text-slate-300">
              Admin payments are sent to this bank account through RazorpayX.
            </p>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <FormInput
                label="Account holder"
                value={form.bankDetails?.accountHolder || ""}
                onChange={updateBank("accountHolder")}
                placeholder="Full name as per bank"
              />
              <FormInput
                label="Bank name"
                value={form.bankDetails?.bankName || ""}
                onChange={updateBank("bankName")}
                placeholder="Bank name"
              />
              <FormInput
                label="Account number"
                value={form.bankDetails?.accountNumber || ""}
                onChange={updateBank("accountNumber")}
                placeholder="Account number"
              />
              <FormInput
                label="IFSC code"
                value={form.bankDetails?.ifscCode || ""}
                onChange={updateBank("ifscCode")}
                placeholder="Example: SBIN0001234"
              />
            </div>
          </section>

          <div className="sticky bottom-0 -mx-5 -mb-5 flex flex-wrap justify-end gap-3 border-t border-slate-200 bg-white/95 px-5 py-4 backdrop-blur dark:border-white/10 dark:bg-slate-900/95 sm:-mx-6 sm:-mb-6 sm:px-6">
            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl bg-slate-100 px-6 py-4 font-black text-slate-700 transition hover:bg-slate-200 dark:bg-white/10 dark:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-2xl bg-slate-950 px-6 py-4 font-black text-white shadow-xl shadow-slate-950/15 transition hover:-translate-y-0.5 dark:bg-amber-300 dark:text-slate-950"
            >
              Save profile
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

function FormInput({
  label,
  type = "text",
  value,
  defaultValue,
  onChange,
  placeholder = "",
  min,
  name,
}) {
  const inputProps =
    value !== undefined ? { value, onChange } : { defaultValue };
  return (
    <label className="grid gap-2 font-bold">
      {label}
      <input
        type={type}
        {...inputProps}
        name={name}
        min={min}
        placeholder={placeholder}
        required
        className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-amber-300 dark:border-white/10 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-500"
      />
    </label>
  );
}

function DashboardShell({
  title,
  subtitle,
  children,
  notifications = [],
  headerActions = null,
  workspaceLabel = "ServiceHub workspace",
  variant = "client",
  sidebarItems = [],
  onProfile,
  onLogout,
}) {
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const hasNotifications = notifications.length > 0;

  return (
    <main className={`dashboard-app-shell dashboard-${variant}`}>
      {mobileSidebarOpen && (
        <button
          type="button"
          className="dashboard-sidebar-backdrop"
          aria-label="Close dashboard menu"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}
      <aside className={`dashboard-sidebar ${mobileSidebarOpen ? "open" : ""}`}>
        <div className="dashboard-brand">
          <img src={SERVICEHUB_ICON} alt="ServiceHub" />
          <span>
            <strong>ServiceHub</strong>
            <small>
              {variant === "provider"
                ? "Provider Control Hub"
                : "Client Control Hub"}
            </small>
          </span>
        </div>
        <nav
          className="dashboard-side-nav"
          aria-label={`${variant} dashboard navigation`}
        >
          {sidebarItems.map(({ label, icon: Icon, onClick, badge, active }) => (
            <button
              key={label}
              type="button"
              className={active ? "active" : ""}
              onClick={() => {
                onClick?.();
                setMobileSidebarOpen(false);
              }}
            >
              <Icon size={19} />
              <span>{label}</span>
              {Number(badge) > 0 && <em>{badge}</em>}
            </button>
          ))}
        </nav>
        <div className="dashboard-sidebar-bottom">
          <div className="dashboard-live-card">
            <span>Live workspace</span>
            <strong>
              {variant === "provider"
                ? "Requests, jobs, tracking, estimates and payouts."
                : "Bookings, providers, payments and reviews."}
            </strong>
          </div>
          <button type="button" className="dashboard-logout" onClick={onLogout}>
            <LogOut size={18} /> Logout
          </button>
        </div>
      </aside>

      <section className="dashboard-main-column dark:bg-none dark:bg-[#081229] dark:text-white">
        <header className="dashboard-topbar">
          <button
            type="button"
            className="dashboard-menu-button"
            aria-label="Open dashboard menu"
            onClick={() => setMobileSidebarOpen(true)}
          >
            <Menu size={21} />
          </button>
          <div className="dashboard-heading">
            <p>{workspaceLabel}</p>
            <h1>{title}</h1>
            <span>{subtitle}</span>
          </div>
          <div className="dashboard-header-actions">
            {headerActions}
            <button
              type="button"
              onClick={onProfile}
              aria-label="Open profile"
              className="dashboard-icon-button"
            >
              <UserRound size={19} />
            </button>
            <div className="dashboard-notification-wrap">
              <button
                type="button"
                onClick={() => setNotificationsOpen((current) => !current)}
                aria-label="Open notifications"
                className="dashboard-icon-button"
              >
                <Bell size={18} />
                {hasNotifications && <b>{notifications.length}</b>}
              </button>
              {notificationsOpen && (
                <div className="dashboard-notification-popover">
                  <div className="dashboard-notification-title">
                    <strong>Notifications</strong>
                    <span>{notifications.length}</span>
                  </div>
                  <div className="dashboard-notification-list">
                    {hasNotifications ? (
                      notifications.map((item, index) => (
                        <div key={`${item.title}-${index}`}>
                          <strong>{item.title}</strong>
                          <p>{item.message}</p>
                        </div>
                      ))
                    ) : (
                      <div>
                        <strong>No notifications</strong>
                        <p>New updates will appear here.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>
        <div className="dashboard-content">{children}</div>
      </section>
    </main>
  );
}

function StatCard({ icon: Icon, label, value }) {
  return (
    <div className="dashboard-stat-card group relative overflow-hidden rounded-[1.35rem] border border-slate-200/80 bg-white p-5 shadow-[0_14px_40px_rgba(15,23,42,0.07)] transition duration-300 hover:-translate-y-1 hover:border-teal-200 hover:shadow-[0_22px_60px_rgba(15,23,42,0.12)] dark:border-white/10 dark:bg-white/5">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-teal-500 via-blue-600 to-amber-300" />
      <div className="flex items-start justify-between gap-4">
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-teal-50 text-teal-700 ring-1 ring-teal-100 transition group-hover:scale-105 dark:bg-teal-300/10 dark:text-teal-100 dark:ring-teal-300/20">
          <Icon size={22} />
        </div>
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-slate-500 dark:bg-white/10 dark:text-slate-300">
          Live
        </span>
      </div>
      <p className="mt-5 text-3xl font-black leading-none text-slate-950 dark:text-white">
        {value}
      </p>
      <p className="mt-2 text-sm font-bold text-slate-500 dark:text-slate-300">
        {label}
      </p>
    </div>
  );
}

function Panel({ title, children, className = "", sectionRef }) {
  return (
    <section
      ref={sectionRef}
      className={`dashboard-panel h-fit overflow-hidden rounded-[1.35rem] border border-slate-200/80 bg-white shadow-[0_16px_45px_rgba(15,23,42,0.07)] dark:border-white/10 dark:bg-white/5 ${className}`}
    >
      <div className="border-b border-slate-100 bg-slate-50/70 px-5 py-4 dark:border-white/10 dark:bg-white/5 sm:px-6">
        <h2 className="text-lg font-black text-slate-950 dark:text-white">
          {title}
        </h2>
      </div>
      <div className="p-5 sm:p-6">{children}</div>
    </section>
  );
}

function JobCard({
  booking,
  actionLabel,
  onAction,
  secondaryAction,
  secondaryActionLabel = "Cancel",
  disabled,
  onEstimateClick,
  alertMode = false,
}) {
  const contactLocked = alertMode || booking.contactLocked;
  const canSubmitFinalEstimate =
    booking.status === "arrived" && Boolean(onEstimateClick);
  const canUpdateFinalEstimate =
    booking.status === "job_started" &&
    booking.paymentStatus !== "paid" &&
    Boolean(onEstimateClick);
  const estimateActionLabel = booking.finalEstimateAmount
    ? "Update Final Estimate"
    : "Submit Final Estimate";
  const hasGps = Boolean(
    booking.clientLocation?.latitude ||
    booking.clientLocation?.lat ||
    (Array.isArray(booking.clientLocation?.coordinates) &&
      booking.clientLocation.coordinates.length === 2),
  );
  return (
    <article className="rounded-2xl border border-slate-200 p-5 dark:border-white/10">
      <div className="flex flex-wrap justify-between gap-3">
        <div>
          <p className="font-black">{booking.service}</p>
          <p className="text-sm text-slate-500">
            {contactLocked
              ? "Client name hidden until accepted"
              : `${booking.name} | ${booking.phone || "Phone not available"}`}
          </p>
          <p className="text-sm text-slate-500">
            {booking.address || "Address not available"}
          </p>
          {booking.problemDescription && (
            <p className="text-sm text-slate-500">
              Problem: {booking.problemDescription}
            </p>
          )}
        </div>
        <StatusBadge status={booking.status} />
      </div>
      {alertMode && (
        <div className="mt-4 flex flex-wrap gap-2 text-xs font-black">
          <span className="rounded-full bg-blue-50 px-3 py-1.5 text-blue-700 dark:bg-blue-400/10 dark:text-blue-200">
            Booking alert
          </span>
          <span className="rounded-full bg-teal-50 px-3 py-1.5 text-teal-700 dark:bg-teal-400/10 dark:text-teal-200">
            Contact unlocks after accept
          </span>
          <span
            className={`rounded-full px-3 py-1.5 ${hasGps && !contactLocked ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-200" : "bg-amber-50 text-amber-700 dark:bg-amber-400/10 dark:text-amber-200"}`}
          >
            {hasGps ? "lat/lng ready for route" : "address route fallback"}
          </span>
        </div>
      )}
      <div className="mt-4 grid gap-2 text-sm text-slate-500">
        <span>
          {formatBookingDate(booking.preferredDate)} at{" "}
          {formatBookingTime(booking.preferredTime)}
        </span>
        <span>
          {booking.serviceDuration} | {formatPrice(booking.costEstimate)}
        </span>
        {booking.status === "cancelled" && booking.cancelledBy === "client" && (
          <span className="font-black text-rose-600">Cancelled by client</span>
        )}
        {booking.status === "cancelled" &&
          booking.cancelledBy === "provider" && (
            <span className="font-black text-rose-600">
              Cancelled by provider:{" "}
              {booking.cancellationReason || "Reason not provided"}
            </span>
          )}
        {booking.status === "rejected" && (
          <span className="font-black text-rose-600">
            Rejected by you: {booking.rejectionReason || "Reason not provided"}
          </span>
        )}
      </div>
      {Boolean(onEstimateClick || booking.finalEstimateAmount) && (
        <div className="mt-4 rounded-2xl border border-teal-100 bg-teal-50 p-4 dark:border-teal-400/20 dark:bg-teal-400/10">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-teal-700 dark:text-teal-200">
              Estimate & earnings
            </p>
            <div className="flex flex-wrap gap-2">
              <EstimateStatusBadge
                status={booking.estimateStatus || "not_submitted"}
              />
              <PaymentStatusBadge status={booking.paymentStatus || "unpaid"} />
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2 text-sm">
            <span className="rounded-xl bg-white p-3 font-black shadow-sm dark:bg-white/10">
              Final Estimate:{" "}
              {booking.finalEstimateAmount
                ? formatMoney(booking.finalEstimateAmount)
                : "Not sent"}
            </span>
            {booking.providerShare ? (
              <span className="rounded-xl bg-white p-3 font-black shadow-sm dark:bg-white/10">
                Your Share: {formatMoney(booking.providerShare)}
              </span>
            ) : null}
          </div>
          {booking.estimateHistory?.length > 1 && (
            <p className="mt-3 text-sm font-semibold text-slate-600 dark:text-slate-300">
              Estimate revised {booking.estimateHistory.length - 1} time
              {booking.estimateHistory.length - 1 === 1 ? "" : "s"}.
            </p>
          )}
          {booking.estimateStatus === "submitted" && (
            <p className="mt-3 text-sm font-black text-amber-700 dark:text-amber-200">
              Estimate sent. Waiting for client response.
            </p>
          )}
          {(canSubmitFinalEstimate || canUpdateFinalEstimate) && (
            <button
              type="button"
              onClick={onEstimateClick}
              className="mt-3 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-black text-teal-800 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:bg-white/10 dark:text-teal-100"
            >
              <IndianRupee size={17} /> {estimateActionLabel}
            </button>
          )}
        </div>
      )}
      {!canSubmitFinalEstimate &&
        !canUpdateFinalEstimate &&
        !booking.finalEstimateAmount &&
        !["completed", "cancelled", "rejected"].includes(booking.status) && (
          <p className="mt-4 rounded-2xl bg-amber-50 px-4 py-3 text-sm font-black text-amber-800 dark:bg-amber-300/10 dark:text-amber-100">
            Mark arrived before sending the final estimate.
          </p>
        )}
      {actionLabel && (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            disabled={disabled}
            onClick={onAction}
            className="rounded-xl bg-slate-950 px-4 py-3 font-black text-white disabled:opacity-50 dark:bg-amber-300 dark:text-slate-950"
          >
            {actionLabel}
          </button>
          {secondaryAction && (
            <button
              type="button"
              onClick={secondaryAction}
              className={
                secondaryActionLabel === "Reject request"
                  ? "rounded-xl bg-rose-50 px-4 py-3 font-black text-rose-700 transition hover:bg-rose-100 dark:bg-rose-400/10 dark:text-rose-200 dark:hover:bg-rose-400/20"
                  : "rounded-xl bg-slate-100 px-4 py-3 font-black transition hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/15"
              }
            >
              {secondaryActionLabel}
            </button>
          )}
        </div>
      )}
    </article>
  );
}
function ProviderCancelModal({ booking, onClose, onSubmit }) {
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit(reason);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div
      className="fixed inset-0 z-[85] grid place-items-center bg-slate-950/70 p-4 backdrop-blur"
      onClick={onClose}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.form
        onSubmit={submit}
        onClick={(event) => event.stopPropagation()}
        initial={{ opacity: 0, y: 24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 18, scale: 0.97 }}
        className="w-full max-w-xl rounded-[2rem] bg-white p-6 shadow-2xl dark:bg-slate-900"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.16em] text-rose-600">
              Cancel booking
            </p>
            <h2 className="mt-2 text-2xl font-black text-slate-950 dark:text-white">
              {booking.service}
            </h2>
            <p className="mt-2 text-sm font-semibold text-slate-500">
              {booking.name} | {booking.phone}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-10 w-10 place-items-center rounded-full bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-white"
          >
            <X size={18} />
          </button>
        </div>
        <label className="mt-5 grid gap-2 font-bold">
          Reason for cancellation
          <textarea
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            rows="5"
            required
            placeholder="Explain why you cannot complete this service so admin can assign another provider."
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-rose-400 dark:border-white/10 dark:bg-[#081229]"
          />
        </label>
        <div className="mt-5 flex flex-wrap justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-slate-100 px-5 py-3 font-black text-slate-700 transition hover:bg-slate-200 dark:bg-white/10 dark:text-white"
          >
            Keep booking
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-xl bg-rose-600 px-5 py-3 font-black text-white shadow-lg shadow-rose-600/15 transition hover:-translate-y-0.5 disabled:opacity-60"
          >
            {submitting ? "Cancelling..." : "Cancel booking"}
          </button>
        </div>
      </motion.form>
    </motion.div>
  );
}

function ProviderRejectModal({ booking, onClose, onSubmit }) {
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit(reason);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div
      className="fixed inset-0 z-[85] grid place-items-center bg-slate-950/70 p-4 backdrop-blur"
      onClick={onClose}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.form
        onSubmit={submit}
        onClick={(event) => event.stopPropagation()}
        initial={{ opacity: 0, y: 24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 18, scale: 0.97 }}
        className="w-full max-w-xl rounded-[2rem] bg-white p-6 shadow-2xl dark:bg-slate-900"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.16em] text-rose-600">
              Reject request
            </p>
            <h2 className="mt-2 text-2xl font-black text-slate-950 dark:text-white">
              {booking.service}
            </h2>
            <p className="mt-2 text-sm font-semibold text-slate-500">
              {booking.address || "Address not available"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-10 w-10 place-items-center rounded-full bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-white"
          >
            <X size={18} />
          </button>
        </div>
        <p className="mt-4 rounded-2xl bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800 dark:bg-amber-300/10 dark:text-amber-100">
          This request will be removed from your dashboard. You will not be able
          to accept it again later.
        </p>
        <label className="mt-5 grid gap-2 font-bold">
          Reason (optional)
          <textarea
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            rows="4"
            placeholder="Let the client know why you cannot take this request."
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-rose-400 dark:border-white/10 dark:bg-[#081229]"
          />
        </label>
        <div className="mt-5 flex flex-wrap justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-slate-100 px-5 py-3 font-black text-slate-700 transition hover:bg-slate-200 dark:bg-white/10 dark:text-white"
          >
            Go back
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-xl bg-rose-600 px-5 py-3 font-black text-white shadow-lg shadow-rose-600/15 transition hover:-translate-y-0.5 disabled:opacity-60"
          >
            {submitting ? "Rejecting..." : "Reject request"}
          </button>
        </div>
      </motion.form>
    </motion.div>
  );
}

function StatusBadge({ status = "pending" }) {
  const color =
    status === "completed"
      ? "bg-emerald-100 text-emerald-700"
      : status === "cancelled" || status === "rejected"
        ? "bg-rose-100 text-rose-700"
        : "bg-amber-100 text-amber-700";
  return (
    <span
      className={`h-fit rounded-full px-3 py-1 text-xs font-black capitalize ${color}`}
    >
      {String(status).replace(/_/g, " ")}
    </span>
  );
}

function EmptyState({ title, copy }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center dark:border-white/15">
      <p className="font-black">{title}</p>
      <p className="mt-2 text-sm text-slate-500">{copy}</p>
    </div>
  );
}

function ActionToast({ message, onClose }) {
  const isError =
    /failed|could not|not found|not available|please|required|expired|invalid|error/i.test(
      message,
    );

  return (
    <motion.div
      initial={{ opacity: 0, y: -24, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -18, scale: 0.98 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      className="fixed left-1/2 top-4 z-[120] w-[calc(100%-1rem)] max-w-xl -translate-x-1/2 sm:top-5 sm:w-[min(92vw,36rem)]"
      role="status"
      aria-live="polite"
    >
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_22px_70px_rgba(15,23,42,0.22)] dark:border-white/10 dark:bg-[#081229]">
        <div
          className={`h-1.5 ${isError ? "bg-rose-500" : "bg-gradient-to-r from-teal-500 via-blue-500 to-amber-300"}`}
        />
        <div className="flex items-start gap-3 px-4 py-4 sm:px-5">
          <div
            className={`grid h-10 w-10 flex-none place-items-center rounded-2xl ${isError ? "bg-rose-50 text-rose-600" : "bg-teal-50 text-teal-700"}`}
          >
            <Bell size={20} />
          </div>
          <p className="min-w-0 flex-1 pt-1 text-sm font-black leading-6 text-slate-900 dark:text-white sm:text-base">
            {message}
          </p>
          <button
            type="button"
            onClick={onClose}
            className="grid h-9 w-9 flex-none place-items-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200 hover:text-slate-950 dark:bg-white/10 dark:text-slate-300 dark:hover:bg-white/15 dark:hover:text-white"
            aria-label="Close message"
          >
            <X size={17} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function ClientSupportSection({ user, setStatusMessage }) {
  const [supportSubmitting, setSupportSubmitting] = useState(false);
  const canSendSupportMessage = user?.role === "user";

  const submitSupport = async (event) => {
    event.preventDefault();
    if (!canSendSupportMessage) {
      setStatusMessage("Please login to send a message");
      return;
    }

    const form = event.currentTarget;
    const formData = new FormData(form);
    const payload = {
      name: user?.name || String(formData.get("name") || "").trim(),
      email: user?.email || String(formData.get("email") || "").trim(),
      message: String(formData.get("message") || "").trim(),
    };

    setSupportSubmitting(true);
    try {
      const response = await fetch(`${API_URL}/contact`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("servicehub_token") || ""}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await parseApiResponse(
        response,
        "Message could not be sent.",
      );
      if (!response.ok)
        throw new Error(data.message || "Message could not be sent.");
      form.reset();
      setStatusMessage(
        "Message sent successfully. Admin can view it in the admin panel.",
      );
    } catch (error) {
      setStatusMessage(error.message);
    } finally {
      setSupportSubmitting(false);
    }
  };

  return (
    <section
      id="contact"
      className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-teal-50 to-cyan-100 px-4 py-20 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 sm:px-6 lg:px-8 lg:py-28 dark:bg-none dark:bg-[#081229] dark:text-white"
    >
      {/* Background Blur Effects */}
      <div className="absolute -top-40 -left-32 h-96 w-96 rounded-full bg-teal-400/20 blur-[120px] animate-pulse"></div>
      <div className="absolute -bottom-40 -right-32 h-96 w-96 rounded-full bg-blue-400/20 blur-[120px] animate-pulse"></div>

      <div className="relative z-10 mx-auto grid max-w-7xl gap-10 lg:grid-cols-2">
        {/* Left Contact Card */}
        <div className="group rounded-[32px] border border-white/40 bg-white/70 backdrop-blur-2xl p-10 shadow-2xl transition-all duration-500 hover:-translate-y-2 hover:shadow-cyan-500/20 dark:border-white/10 dark:bg-white/10">
          <span className="inline-flex items-center rounded-full bg-gradient-to-r from-teal-500 to-cyan-600 px-5 py-2 text-sm font-bold text-white shadow-lg">
            Contact Support
          </span>

          <h2 className="mt-8 text-4xl font-black leading-tight text-slate-900 dark:text-white md:text-5xl">
            Talk to ServiceHub Support
          </h2>

          <p className="mt-6 text-lg leading-8 text-slate-600 dark:text-slate-300">
            Need urgent service, provider onboarding, partnerships or booking
            assistance? Our support team is always ready to help you.
          </p>

          <div className="mt-10 space-y-5">
            <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white/70 p-5 backdrop-blur-xl transition-all duration-300 hover:translate-x-2 hover:shadow-lg dark:border-white/10 dark:bg-white/10">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-100 text-teal-600">
                <MessageCircle size={22} />
              </div>

              <div>
                <p className="text-sm text-slate-500">Email</p>
                <p className="font-semibold text-slate-900 dark:text-white">
                  info.aparaitech@gmail.com
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white/70 p-5 backdrop-blur-xl transition-all duration-300 hover:translate-x-2 hover:shadow-lg dark:border-white/10 dark:bg-white/10">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                <MapPin size={22} />
              </div>

              <div>
                <p className="text-sm text-slate-500">Location</p>
                <p className="font-semibold text-slate-900 dark:text-white">
                  Baramati, Maharashtra, India
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white/70 p-5 backdrop-blur-xl transition-all duration-300 hover:translate-x-2 hover:shadow-lg dark:border-white/10 dark:bg-white/10">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
                <CalendarCheck size={22} />
              </div>

              <div>
                <p className="text-sm text-slate-500">Working Hours</p>
                <p className="font-semibold text-slate-900 dark:text-white">
                  8:00 AM - 9:00 PM
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <form
          onSubmit={submitSupport}
          className="rounded-[32px] border border-white/40 bg-white/70 p-10 backdrop-blur-2xl shadow-2xl transition-all duration-500 hover:-translate-y-2 hover:shadow-blue-500/20 dark:border-white/10 dark:bg-white/10"
        >
          {!canSendSupportMessage && (
            <div className="mb-6 inline-flex rounded-full bg-gradient-to-r from-teal-500 to-blue-600 px-5 py-2 text-sm font-bold text-white shadow-lg">
              Contact Us
            </div>
          )}

          <h3 className="mb-2 text-3xl font-black text-slate-900 dark:text-white">
            Send a Message
          </h3>

          <p className="mb-8 text-slate-500 dark:text-slate-300">
            Fill out the form below and we'll get back to you shortly.
          </p>

          <FormInput
            label="Name"
            name="name"
            defaultValue={user?.name || ""}
            placeholder="Your name"
          />

          <div className="mt-5">
            <FormInput
              label="Email"
              name="email"
              type="email"
              defaultValue={user?.email || ""}
              placeholder="you@example.com"
            />
          </div>

          <label className="mt-5 grid gap-2 font-bold text-slate-700 dark:text-white">
            Message
            <textarea
              name="message"
              placeholder="How can we help?"
              rows="5"
              required
              className="w-full rounded-2xl border border-slate-300 bg-white/70 px-5 py-4 backdrop-blur-xl outline-none transition-all duration-300 placeholder:text-slate-400 focus:border-teal-500 focus:ring-4 focus:ring-teal-300 dark:border-white/20 dark:bg-white/10"
            />
          </label>

          <button
            type="submit"
            disabled={supportSubmitting}
            className="group mt-8 inline-flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-teal-500 via-cyan-500 to-blue-600 px-8 py-4 text-lg font-bold text-white shadow-xl transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02] hover:shadow-cyan-500/40 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Send
              size={20}
              className="transition-transform duration-300 group-hover:translate-x-2"
            />

            {supportSubmitting
              ? "Sending..."
              : canSendSupportMessage
                ? "Send Message"
                : "Contact Us"}
          </button>
        </form>
      </div>
    </section>
  );
}
function ServiceHubFooter({ onServiceClick }) {
  return (
    <footer className="bg-[#151f28] px-4 py-12 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-[1.3fr_0.9fr_1.05fr_1fr]">
          <div className="space-y-2">
            {/* Logo & Brand */}
            <div className="flex items-center gap-4">
              <div className="group relative">
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-cyan-500 via-blue-500 to-violet-500 blur-lg opacity-60 transition duration-500 group-hover:opacity-100 group-hover:scale-110"></div>

                <span className="relative grid h-16 w-16 place-items-center overflow-hidden rounded-3xl border border-white/20 bg-white/10 backdrop-blur-xl shadow-2xl">
                  <img
                    src={SERVICEHUB_ICON}
                    alt="ServiceHub symbol"
                    className="h-11 w-11 object-contain transition duration-500 group-hover:rotate-12 group-hover:scale-110"
                  />
                </span>
              </div>

              <div>
                <h2 className="bg-gradient-to-r from-cyan-300 via-white to-violet-300 bg-clip-text text-4xl font-black tracking-tight text-transparent">
                  ServiceHub
                </h2>

                <p className="mt-1 text-sm tracking-[0.3em] uppercase text-cyan-300">
                  Trusted Home Services
                </p>
              </div>
            </div>

            {/* Description Card */}
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl transition duration-500 hover:border-cyan-400/40 hover:bg-white/10 hover:shadow-2xl hover:shadow-cyan-500/10">
              <p className="text-lg leading-8 text-slate-300">
                Trusted local professionals for home repairs, maintenance,
                installation and emergency support with quick response.
              </p>
            </div>

            {/* Verified Badge */}
            <div className="group flex items-center gap-4 rounded-2xl border border-emerald-400/20 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-cyan-500/10 p-5 backdrop-blur-xl transition duration-500 hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-500/20">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-r from-emerald-400 to-cyan-500 text-white shadow-lg">
                <ShieldCheck className="h-6 w-6 transition duration-500 group-hover:rotate-12" />
              </div>

              <div>
                <p className="font-bold text-white">Verified Professionals</p>

                <p className="text-sm text-slate-300">
                  Trusted providers with reliable customer support
                </p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="mb-6 inline-flex rounded-full bg-gradient-to-r from-cyan-500 via-blue-500 to-violet-600 px-5 py-2 text-lg font-bold text-white shadow-lg">
              Popular Services
            </h3>

            <div className="grid gap-3">
              {[
                "Plumber",
                "Electrician",
                "Carpenter",
                "Painter",
                "AC Repair",
                "Refrigerator Repair",
                "Washing Machine Repair",
                "TV Repair",
              ].map((service) => (
                <button
                  key={service}
                  type="button"
                  onClick={() => onServiceClick(service)}
                  className="
          group
          flex
          items-center
          justify-between
          rounded-2xl
          border
          border-white/10
          bg-white/5
          px-5
          py-3
          text-left
          text-slate-200
          backdrop-blur-xl
          transition-all
          duration-300
          hover:-translate-x-2
          hover:border-cyan-400/40
          hover:bg-gradient-to-r
          hover:from-cyan-500/20
          hover:via-blue-500/20
          hover:to-violet-500/20
          hover:text-white
          hover:shadow-xl
          hover:shadow-cyan-500/20
        "
                >
                  <span>{service}</span>

                  <span className="text-xl transition duration-300 group-hover:translate-x-2">
                    →
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="mb-6 inline-flex rounded-full bg-gradient-to-r from-cyan-500 via-blue-500 to-violet-600 px-5 py-2 text-lg font-bold text-white shadow-lg">
              Contact
            </h3>

            <div className="space-y-4">
              {/* Phone */}
              <div className="group flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl transition-all duration-500 hover:-translate-y-1 hover:scale-[1.02] hover:border-cyan-400/40 hover:bg-cyan-500/10 hover:shadow-xl hover:shadow-cyan-500/20">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 shadow-lg transition-all duration-500 group-hover:rotate-12 group-hover:scale-110">
                  <Phone className="h-5 w-5 text-white" />
                </div>

                <div>
                  <p className="text-xs uppercase tracking-widest text-slate-400">
                    Phone
                  </p>
                  <p className="font-semibold text-white">+91 9158852129</p>
                </div>
              </div>

              {/* Email */}
              <div className="group flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl transition-all duration-500 hover:-translate-y-1 hover:scale-[1.02] hover:border-pink-400/40 hover:bg-pink-500/10 hover:shadow-xl hover:shadow-pink-500/20">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 shadow-lg transition-all duration-500 group-hover:rotate-12 group-hover:scale-110">
                  <Mail className="h-5 w-5 text-white" />
                </div>

                <div>
                  <p className="text-xs uppercase tracking-widest text-slate-400">
                    Email
                  </p>
                  <p className="font-semibold text-white break-all">
                    info.aparaitech@gmail.com
                  </p>
                </div>
              </div>

              {/* Address */}
              <div className="group flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl transition-all duration-500 hover:-translate-y-1 hover:scale-[1.02] hover:border-orange-400/40 hover:bg-orange-500/10 hover:shadow-xl hover:shadow-orange-500/20">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-r from-orange-400 to-red-500 shadow-lg transition-all duration-500 group-hover:rotate-12 group-hover:scale-110">
                  <MapPin className="h-5 w-5 text-white" />
                </div>

                <div>
                  <p className="text-xs uppercase tracking-widest text-slate-400">
                    Address
                  </p>
                  <p className="font-semibold text-white">
                    Baramati, Maharashtra
                  </p>
                </div>
              </div>

              {/* Working Hours */}
              <div className="group flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl transition-all duration-500 hover:-translate-y-1 hover:scale-[1.02] hover:border-violet-400/40 hover:bg-violet-500/10 hover:shadow-xl hover:shadow-violet-500/20">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-r from-violet-500 to-indigo-600 shadow-lg transition-all duration-500 group-hover:rotate-12 group-hover:scale-110">
                  <CalendarCheck className="h-5 w-5 text-white" />
                </div>

                <div>
                  <p className="text-xs uppercase tracking-widest text-slate-400">
                    Working Hours
                  </p>
                  <p className="font-semibold text-white">
                    Mon - Sun • 8:00 AM - 9:00 PM
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div>
            <h3 className="mb-6 inline-flex rounded-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500 px-5 py-2 text-lg font-bold text-white shadow-lg">
              For Clients
            </h3>

            <div className="group rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl transition-all duration-500 hover:-translate-y-2 hover:border-violet-400/40 hover:bg-white/10 hover:shadow-2xl hover:shadow-violet-500/20">
              <p className="text-lg leading-8 text-slate-300">
                Book nearby service providers, compare ratings, and get help for
                urgent repair needs.
              </p>

              <div className="mt-6 rounded-2xl bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-violet-500/10 p-5 ring-1 ring-cyan-400/20 transition-all duration-500 group-hover:scale-[1.02]">
                <p className="flex items-center gap-2 font-bold text-white">
                  💬 Need help?
                </p>

                <p className="mt-2 leading-7 text-slate-300">
                  Call us for booking assistance or service issues.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 border-t border-white/10 pt-8">
          <div className="flex flex-col items-center justify-between gap-5 lg:flex-row">
            <span className="text-center text-slate-400">
              © <span className="font-bold text-white">2026 ServiceHub</span>.
              All Rights Reserved.
            </span>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <a
                href="/contact"
                className="rounded-full border border-cyan-400/20 bg-cyan-500/10 px-4 py-2 text-sm text-cyan-300 transition-all duration-300 hover:-translate-y-1 hover:bg-cyan-500/20"
              >
                Contact
              </a>

              <a
                href="/privacy-policy"
                className="rounded-full border border-pink-400/20 bg-pink-500/10 px-4 py-2 text-sm text-pink-300 transition-all duration-300 hover:-translate-y-1 hover:bg-pink-500/20"
              >
                Privacy Policy
              </a>

              <a
                href="/terms-and-conditions"
                className="rounded-full border border-violet-400/20 bg-violet-500/10 px-4 py-2 text-sm text-violet-300 transition-all duration-300 hover:-translate-y-1 hover:bg-violet-500/20"
              >
                Terms
              </a>

              <span className="rounded-full bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-violet-500/10 px-4 py-2 text-sm text-slate-300 ring-1 ring-white/10">
                📍 Serving homes across Pune and nearby cities.
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

export function ModernFooter() {
  return (
    <footer className="bg-slate-950 px-4 py-12 text-white sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-8 md:grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr]">
        <div>
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center overflow-hidden rounded-2xl bg-white p-1">
              <img
                src={SERVICEHUB_ICON}
                alt="ServiceHub symbol"
                className="h-full w-full rounded-xl object-contain"
              />
            </span>
            <span className="text-xl font-black">ServiceHub</span>
          </div>
          <p className="mt-4 max-w-sm text-slate-400">
            Premium local services for Indian homes, built with trust, status
            clarity, and real provider workflows.
          </p>
        </div>
        {["Company", "Services", "Support"].map((group) => (
          <div key={group}>
            <p className="font-black">{group}</p>
            <div className="mt-4 grid gap-3 text-slate-400">
              <span>About</span>
              <span>Providers</span>
              <span>Careers</span>
            </div>
          </div>
        ))}
      </div>
      <div className="mx-auto mt-10 flex max-w-7xl flex-wrap justify-between gap-4 border-t border-white/10 pt-6 text-sm text-slate-400">
        <span>© 2026 ServiceHub</span>
        <span className="flex items-center gap-2">
          Made for modern service teams <ChevronRight size={14} />
        </span>
      </div>
    </footer>
  );
}
