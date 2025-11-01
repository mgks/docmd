---
title: "Analytics Integration"
description: "Integrate web analytics services like Google Analytics into your docmd site to track visitor traffic."
---

# Analytics Integration Plugin

`docmd` allows you to easily integrate popular web analytics services into your documentation site using the built-in analytics plugin. This helps you understand your audience, track page views, and gather insights into how your documentation is being used.

## Enabling Analytics Plugin

You enable analytics by adding the analytics plugin and its configuration to the `plugins` object in your config file.

**Example:**

```javascript
module.exports = {
  // ...
  plugins: {
    // Analytics plugin configuration
    analytics: {
      // For Google Analytics 4 (GA4)
      googleV4: {
        measurementId: 'G-XXXXXXXXXX' // Your GA4 Measurement ID
      },
      
      // For Google Universal Analytics (Legacy)
      // googleUA: {
      //   trackingId: 'UA-XXXXXXXXX-Y' // Your Universal Analytics Tracking ID
      // }
    },
    
    // ... other plugins
  },
  // ...
};
```

Choose the analytics service and version you want to use by configuring the appropriate section.

## Available Analytics Options

### Google Analytics 4 (GA4)

* **Configuration Key:** `googleV4`
* **Description:** Integrates the latest version of Google Analytics, GA4. This is the recommended version for new Google Analytics setups.
* **Options:**
  * `measurementId` (String, Required): Your Google Analytics 4 Measurement ID, which typically looks like `G-XXXXXXXXXX`.
* **Action:** Injects the standard Google Analytics 4 `gtag.js` tracking snippet into your pages.

### Google Universal Analytics (Legacy)

* **Configuration Key:** `googleUA`
* **Description:** Integrates the older version of Google Analytics, known as Universal Analytics (UA). Note that Google has sunset Universal Analytics as of July 2023.
* **Options:**
  * `trackingId` (String, Required): Your Google Universal Analytics Tracking ID, which typically looks like `UA-XXXXXXXXX-Y`.
* **Action:** Injects the standard Google Universal Analytics `analytics.js` tracking snippet into your pages.

## Important Considerations

* **Choose One Google Analytics Version:** If using Google Analytics, configure *either* `googleUA` *or* `googleV4`, but not both for the same property, to avoid incorrect data collection.
* **Privacy and Consent:**
  * Be mindful of user privacy when implementing analytics.
  * Clearly disclose your use of analytics (and any cookies set by them) in your site's privacy policy or a cookie consent banner if required by regulations in your target regions (e.g., GDPR, CCPA).
  * Consider features like IP anonymization if your analytics provider offers them and it's appropriate for your privacy stance.
* **Testing:** After enabling the analytics plugin and deploying your site, verify that data is being collected correctly in your analytics provider's dashboard. Use browser developer tools (Network tab) to check if the tracking script is loading.

## Future Analytics Support

`docmd` may add support for other privacy-focused or popular analytics providers in the future, such as:
* Plausible Analytics
* Fathom Analytics
* Simple Analytics

Check the latest `docmd` documentation or GitHub repository for updates on supported analytics integrations.