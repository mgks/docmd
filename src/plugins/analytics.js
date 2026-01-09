// Source file from the docmd project — https://github.com/docmd-io/docmd

/*
 * Generate analytics scripts for a page
 */

function generateAnalyticsScripts(config, pageData) {
    let headScriptsHtml = '';
    let bodyScriptsHtml = ''; // For scripts that need to be at the end of body
  
    const analyticsConfig = config.plugins?.analytics || {}; // Assuming analytics is under plugins.analytics
  
    // Google Analytics 4 (GA4)
    if (analyticsConfig.googleV4?.measurementId) {
      const id = analyticsConfig.googleV4.measurementId;
      headScriptsHtml += `
      <!-- Google Analytics GA4 -->
      <script async src="https://www.googletagmanager.com/gtag/js?id=${id}"></script>
      <script>
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${id}');
      </script>\n`;
    }
  
    // Google Analytics Universal Analytics (UA) - Legacy
    if (analyticsConfig.googleUA?.trackingId) {
      const id = analyticsConfig.googleUA.trackingId;
      headScriptsHtml += `
      <!-- Google Universal Analytics (Legacy) -->
      <script async src="https://www.google-analytics.com/analytics.js"></script>
      <script>
        window.ga=window.ga||function(){(ga.q=ga.q||[]).push(arguments)};ga.l=+new Date;
        ga('create', '${id}', 'auto');
        ga('send', 'pageview');
      </script>\n`;
    }
  
    // Example for a hypothetical future plugin requiring body script
    // if (config.plugins?.someOtherAnalytics?.apiKey) {
    //   bodyScriptsHtml += `<script src="..."></script>\n`;
    // }
  
    return { headScriptsHtml, bodyScriptsHtml };
  }
  
  module.exports = { generateAnalyticsScripts };