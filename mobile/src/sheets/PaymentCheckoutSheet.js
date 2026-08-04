import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import ActionButton from "../components/ActionButton";
import { formatPrice } from "../lib/formatters";
import { colors, radius, shadow, useThemeColors } from "../theme";

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

function toScriptJson(value) {
  return JSON.stringify(value).replace(/<\//g, "<\\/");
}

// How long to wait before forcibly hiding the loading overlay.
// Prevents a permanent spinner when onLoadEnd is delayed (native) or the
// Razorpay script is slow to download (web).
const LOAD_TIMEOUT_MS = 15000;

// ---------------------------------------------------------------------------
// Native-only: inline HTML loaded into a WebView
// ---------------------------------------------------------------------------

function buildCheckoutHtml({ keyId, orderId, amountPaise, currency, bookingId, prefill }) {
  const options = {
    key: keyId,
    amount: String(amountPaise),
    currency: currency || "INR",
    name: "ServiceHub",
    description: "Final estimate payment",
    order_id: orderId,
    prefill: prefill || {},
    notes: { bookingId: bookingId || "" },
    retry: { enabled: true, max_count: 2 },
    theme: { color: "#0f766e" },
  };

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no" />
    <style>
      html, body {
        background: #f8fafc;
        color: #0f172a;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        height: 100%;
        margin: 0;
      }
      .state {
        align-items: center;
        display: flex;
        flex-direction: column;
        gap: 12px;
        height: 100%;
        justify-content: center;
        padding: 24px;
        text-align: center;
      }
      .mark {
        align-items: center;
        background: #ccfbf1;
        border-radius: 18px;
        color: #0f766e;
        display: flex;
        font-size: 28px;
        font-weight: 900;
        height: 64px;
        justify-content: center;
        width: 64px;
      }
      h1 { font-size: 20px; line-height: 26px; margin: 0; }
      p  { color: #64748b; font-size: 14px; font-weight: 700; line-height: 21px; margin: 0; }
    </style>
  </head>
  <body>
    <div class="state">
      <div class="mark">&#8377;</div>
      <h1>Opening secure payment</h1>
      <p>Please wait while Razorpay checkout loads.</p>
    </div>
    <script
      src="https://checkout.razorpay.com/v1/checkout.js"
      onerror="post({ type: 'error', message: 'Razorpay script failed to load. Check your internet connection.' })"
    ></script>
    <script>
      function post(payload) {
        try {
          window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify(payload));
        } catch(e) {}
      }

      function openCheckout() {
        try {
          if (!window.Razorpay) {
            post({ type: 'error', message: 'Razorpay checkout could not be loaded. Check your internet connection.' });
            return;
          }

          var options = ${toScriptJson(options)};
          options.handler = function(response) {
            post({ type: 'success', response: response });
          };
          options.modal = {
            ondismiss: function() {
              post({ type: 'dismissed' });
            }
          };

          var razorpay = new Razorpay(options);
          razorpay.on('payment.failed', function(response) {
            var message = response && response.error && response.error.description
              ? response.error.description
              : 'Payment failed. Please try again.';
            post({ type: 'failed', message: message, response: response });
          });
          razorpay.open();
          post({ type: 'checkout_opened' });
        } catch(e) {
          post({ type: 'error', message: e && e.message ? e.message : 'Checkout could not be opened.' });
        }
      }

      if (document.readyState === 'complete') {
        openCheckout();
      } else {
        window.addEventListener('load', openCheckout);
      }
    </script>
  </body>
</html>`;
}

// ---------------------------------------------------------------------------
// Web-only: load Razorpay SDK into the real browser document, then open popup
// ---------------------------------------------------------------------------

function loadRazorpayScript() {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) {
      resolve();
      return;
    }

    const existing = document.getElementById("razorpay-checkout-js");
    if (existing) {
      // Script tag already injected — wait for it to finish loading.
      existing.addEventListener("load", resolve, { once: true });
      existing.addEventListener("error", () => reject(new Error("Razorpay script failed to load.")), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.id = "razorpay-checkout-js";
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = resolve;
    script.onerror = () => reject(new Error("Razorpay script failed to load. Check your internet connection."));
    document.head.appendChild(script);
  });
}

// Web checkout: imperatively loads the SDK and opens the Razorpay popup.
// Returns a cleanup function that the caller should invoke on unmount.
function openWebCheckout({ keyId, orderId, amountPaise, currency, bookingId, prefill, onSuccess, onFailure, onLoaded }) {
  let cancelled = false;
  let rzpInstance = null;

  loadRazorpayScript()
    .then(() => {
      if (cancelled) return;

      if (!window.Razorpay) {
        onFailure("Razorpay checkout could not be loaded. Check your internet connection.");
        return;
      }

      const options = {
        key: keyId,
        amount: String(amountPaise),
        currency: currency || "INR",
        name: "ServiceHub",
        description: "Final estimate payment",
        order_id: orderId,
        prefill: prefill || {},
        notes: { bookingId: bookingId || "" },
        retry: { enabled: true, max_count: 2 },
        theme: { color: "#0f766e" },
        handler: (response) => {
          if (!cancelled) onSuccess(response);
        },
        modal: {
          ondismiss: () => {
            if (!cancelled) onFailure("Payment was cancelled.");
          },
        },
      };

      try {
        rzpInstance = new window.Razorpay(options);
        rzpInstance.on("payment.failed", (response) => {
          if (cancelled) return;
          const message =
            response?.error?.description || "Payment failed. Please try again.";
          onFailure(message);
        });
        rzpInstance.open();
        onLoaded(); // signal: overlay can be hidden
      } catch (err) {
        if (!cancelled) onFailure(err?.message || "Checkout could not be opened.");
      }
    })
    .catch((err) => {
      if (!cancelled) onFailure(err?.message || "Razorpay script could not be loaded.");
    });

  return function cancel() {
    cancelled = true;
    try { rzpInstance?.close(); } catch (_) {}
  };
}

// ---------------------------------------------------------------------------
// Web variant of the sheet — full-screen overlay, no WebView, no RN Modal
// ---------------------------------------------------------------------------

function PaymentCheckoutSheetWeb({
  visible,
  checkout,
  verifying,
  error,
  onClose,
  onSuccess,
  onFailure,
  onRetry,
}) {
  const theme = useThemeColors();
  const [loading, setLoading] = useState(false);
  const loadTimeoutRef = useRef(null);
  const cancelCheckoutRef = useRef(null);

  const booking = checkout?.booking || {};
  const order = checkout?.order || {};
  const orderId = order.orderId || "";
  const keyId = order.keyId || "";
  const currency = order.currency || "INR";
  const amountPaise = Number(order.amountPaise || Math.round(Number(order.amount || 0) * 100));
  const amount = Number(order.amount || booking.finalEstimateAmount || 0);
  const bookingId = String(booking._id || booking.id || "");
  const prefill = useMemo(
    () => ({
      name: booking.name || booking.userName || "",
      email: booking.userEmail || "",
      contact: booking.phone || "",
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [booking.name, booking.userName, booking.userEmail, booking.phone]
  );

  // Open the Razorpay popup whenever a valid order becomes visible.
  useEffect(() => {
    if (!visible || !orderId || !keyId) return;

    // Cancel any previous checkout attempt.
    if (cancelCheckoutRef.current) {
      cancelCheckoutRef.current();
      cancelCheckoutRef.current = null;
    }

    setLoading(true);

    // Safety timeout: hide loading state if SDK takes too long.
    if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);
    loadTimeoutRef.current = setTimeout(() => setLoading(false), LOAD_TIMEOUT_MS);

    const cancel = openWebCheckout({
      keyId,
      orderId,
      amountPaise,
      currency,
      bookingId,
      prefill,
      onLoaded: () => {
        if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);
        setLoading(false);
      },
      onSuccess: (response) => {
        if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);
        setLoading(false);
        onSuccess?.(response);
      },
      onFailure: (message) => {
        if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);
        setLoading(false);
        onFailure?.(message);
      },
    });

    cancelCheckoutRef.current = cancel;

    return () => {
      if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);
      // Do NOT cancel on cleanup — the Razorpay modal may still be open.
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, orderId]);

  if (!visible) return null;

  return (
    <View style={[webStyles.overlay, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[webStyles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <View style={webStyles.titleWrap}>
          <Text style={[webStyles.title, { color: theme.text }]}>Secure Payment</Text>
          <Text style={[webStyles.subtitle, { color: theme.textMuted }]} numberOfLines={1}>
            {booking.service || "Final estimate"} {amount ? `| ${formatPrice(amount)}` : ""}
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={onClose}
          disabled={verifying}
          style={[webStyles.closeButton, { backgroundColor: theme.surfaceMuted }]}
        >
          <MaterialCommunityIcons name="close" size={22} color={theme.text} />
        </Pressable>
      </View>

      {/* Error banner */}
      {error ? (
        <View style={[webStyles.errorBox, { backgroundColor: theme.roseSoft, borderColor: theme.rose }]}>
          <Text style={[webStyles.errorText, { color: theme.rose }]}>{error}</Text>
          {onRetry ? (
            <ActionButton title="Retry verification" icon="refresh" variant="dangerSoft" onPress={onRetry} />
          ) : null}
        </View>
      ) : null}

      {/* Loading / verifying state */}
      {(loading || verifying) ? (
        <View style={[webStyles.loadingWrap, { backgroundColor: theme.surface }]}>
          <ActivityIndicator color={theme.teal} size="large" />
          <Text style={[webStyles.loadingText, { color: theme.textMuted }]}>
            {verifying ? "Verifying payment..." : "Opening Razorpay checkout..."}
          </Text>
        </View>
      ) : (
        // Placeholder shown behind the Razorpay popup while it is open.
        <View style={[webStyles.loadingWrap, { backgroundColor: theme.surface }]}>
          <View style={webStyles.mark}>
            <Text style={webStyles.markText}>₹</Text>
          </View>
          <Text style={[webStyles.hint, { color: theme.textMuted }]}>
            Complete your payment in the Razorpay window.
          </Text>
        </View>
      )}
    </View>
  );
}

const webStyles = StyleSheet.create({
  closeButton: {
    alignItems: "center",
    borderRadius: radius.md,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  errorBox: {
    borderRadius: radius.md,
    borderWidth: 1,
    gap: 10,
    margin: 12,
    padding: 12,
  },
  errorText: {
    fontSize: 13,
    fontWeight: "800",
    lineHeight: 19,
  },
  header: {
    alignItems: "center",
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    ...shadow,
  },
  hint: {
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 21,
    textAlign: "center",
  },
  loadingText: {
    fontSize: 14,
    fontWeight: "800",
  },
  loadingWrap: {
    alignItems: "center",
    flex: 1,
    gap: 16,
    justifyContent: "center",
    padding: 24,
  },
  mark: {
    alignItems: "center",
    backgroundColor: "#ccfbf1",
    borderRadius: 18,
    height: 64,
    justifyContent: "center",
    width: 64,
  },
  markText: {
    color: "#0f766e",
    fontSize: 28,
    fontWeight: "900",
  },
  overlay: {
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 19,
  },
  title: {
    fontSize: 21,
    fontWeight: "900",
    letterSpacing: 0,
  },
  titleWrap: {
    flex: 1,
    minWidth: 0,
  },
});

// ---------------------------------------------------------------------------
// Native variant — unchanged WebView implementation
// ---------------------------------------------------------------------------

// Lazy-require so the web bundler never attempts to resolve react-native-webview.
const NativeWebView = Platform.OS !== "web" ? require("react-native-webview").WebView : null;

function PaymentCheckoutSheetNative({
  visible,
  checkout,
  verifying,
  error,
  onClose,
  onSuccess,
  onFailure,
  onRetry,
}) {
  const theme = useThemeColors();
  const [loading, setLoading] = useState(true);
  const loadTimeoutRef = useRef(null);

  const booking = checkout?.booking || {};
  const order = checkout?.order || {};
  const orderId = order.orderId || "";
  const keyId = order.keyId || "";
  const currency = order.currency || "INR";
  const amountPaise = Number(order.amountPaise || Math.round(Number(order.amount || 0) * 100));
  const amount = Number(order.amount || booking.finalEstimateAmount || 0);
  const bookingId = String(booking._id || booking.id || "");
  const prefill = useMemo(
    () => ({
      name: booking.name || booking.userName || "",
      email: booking.userEmail || "",
      contact: booking.phone || "",
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [booking.name, booking.userName, booking.userEmail, booking.phone]
  );

  // html only regenerates when the actual order changes — not on paymentResponse updates.
  const html = useMemo(
    () => buildCheckoutHtml({ keyId, orderId, amountPaise, currency, bookingId, prefill }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [keyId, orderId, amountPaise, currency, bookingId]
  );

  // Key the WebView to orderId so it only fully reloads when a new order is created.
  const webViewKey = orderId || "no-order";

  // Reset loading state whenever a new order is loaded.
  useEffect(() => {
    if (visible && orderId) {
      setLoading(true);

      if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);
      loadTimeoutRef.current = setTimeout(() => {
        setLoading(false);
      }, LOAD_TIMEOUT_MS);
    }

    return () => {
      if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);
    };
  }, [visible, orderId]);

  const handleMessage = (event) => {
    let payload = null;
    try {
      payload = JSON.parse(event.nativeEvent.data);
    } catch {
      return;
    }

    if (payload.type === "checkout_opened") {
      if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);
      setLoading(false);
      return;
    }

    if (payload.type === "success") {
      onSuccess?.(payload.response);
      return;
    }

    if (payload.type === "dismissed") {
      onFailure?.("Payment was cancelled.");
      return;
    }

    if (payload.type === "failed" || payload.type === "error") {
      if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);
      setLoading(false);
      onFailure?.(payload.message || "Payment could not be completed.");
    }
  };

  const WebView = NativeWebView;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={[styles.wrap, { backgroundColor: theme.background }]}>
        <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
          <View style={styles.titleWrap}>
            <Text style={[styles.title, { color: theme.text }]}>Secure Payment</Text>
            <Text style={[styles.subtitle, { color: theme.textMuted }]} numberOfLines={1}>
              {booking.service || "Final estimate"} {amount ? `| ${formatPrice(amount)}` : ""}
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={onClose}
            disabled={verifying}
            style={[styles.closeButton, { backgroundColor: theme.surfaceMuted }]}
          >
            <MaterialCommunityIcons name="close" size={22} color={theme.text} />
          </Pressable>
        </View>

        {error ? (
          <View style={[styles.errorBox, { backgroundColor: theme.roseSoft, borderColor: theme.rose }]}>
            <Text style={[styles.errorText, { color: theme.rose }]}>{error}</Text>
            {onRetry ? (
              <ActionButton title="Retry verification" icon="refresh" variant="dangerSoft" onPress={onRetry} />
            ) : null}
          </View>
        ) : null}

        <View style={styles.webWrap}>
          <WebView
            key={webViewKey}
            source={{ html, baseUrl: "https://checkout.razorpay.com" }}
            originWhitelist={["*"]}
            javaScriptEnabled
            domStorageEnabled
            mixedContentMode="always"
            onShouldStartLoadWithRequest={(request) => {
              const url = request.url || "";
              if (
                url.startsWith("http://") ||
                url.startsWith("https://") ||
                url.startsWith("about:blank") ||
                url.startsWith("data:")
              ) {
                return true;
              }
              Linking.openURL(url).catch(() => {});
              return false;
            }}
            onLoadEnd={() => {
              if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);
              setLoading(false);
            }}
            onMessage={handleMessage}
            onError={(event) => {
              if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);
              setLoading(false);
              onFailure?.(event.nativeEvent.description || "Payment page could not be opened.");
            }}
            style={styles.webView}
          />
          {(loading || verifying) ? (
            <View style={[styles.loading, { backgroundColor: theme.surface }]}>
              <ActivityIndicator color={theme.teal} size="large" />
              <Text style={[styles.loadingText, { color: theme.textMuted }]}>
                {verifying ? "Verifying payment..." : "Opening Razorpay checkout..."}
              </Text>
            </View>
          ) : null}
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  closeButton: {
    alignItems: "center",
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  errorBox: {
    backgroundColor: colors.roseSoft,
    borderColor: colors.rose,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: 10,
    margin: 12,
    padding: 12,
  },
  errorText: {
    color: colors.rose,
    fontSize: 13,
    fontWeight: "800",
    lineHeight: 19,
  },
  header: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    ...shadow,
  },
  loading: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    backgroundColor: colors.surface,
    gap: 12,
    justifyContent: "center",
  },
  loadingText: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: "800",
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 19,
  },
  title: {
    color: colors.text,
    fontSize: 21,
    fontWeight: "900",
    letterSpacing: 0,
  },
  titleWrap: {
    flex: 1,
    minWidth: 0,
  },
  webView: {
    backgroundColor: colors.background,
    flex: 1,
  },
  webWrap: {
    flex: 1,
    overflow: "hidden",
  },
  wrap: {
    backgroundColor: colors.background,
    flex: 1,
  },
});

// ---------------------------------------------------------------------------
// Public export — dispatches to the correct implementation by platform
// ---------------------------------------------------------------------------

export default function PaymentCheckoutSheet(props) {
  if (Platform.OS === "web") {
    return <PaymentCheckoutSheetWeb {...props} />;
  }
  return <PaymentCheckoutSheetNative {...props} />;
}
