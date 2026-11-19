/**
 * Tracking IDs. Leave empty until supplied by the owner: nothing is loaded while they are empty.
 *   ga4MeasurementId   GA4 web stream ID, format G-XXXXXXXXXX
 *   googleAdsId        Google Ads account ID, format AW-XXXXXXXXXX
 *   googleAdsLabels    one conversion label per action, copied from Google Ads > Goals > Conversions > Tag setup
 *                      (the part after the slash in "AW-XXXXXXXXXX/<label>")
 */
export const environment = {
  production: false,
  ga4MeasurementId: '', // e.g. 'G-XXXXXXXXXX'
  googleAdsId: '', // e.g. 'AW-XXXXXXXXXX'
  googleAdsLabels: {
    commercialLead: '', // shrineva_commercial_lead
    phoneClick: '', // shrineva_phone_click
    whatsappClick: '', // shrineva_whatsapp_click
    brochureDownload: '', // shrineva_brochure_download
    residentialLead: '', // shrineva_residential_lead
  },
};
