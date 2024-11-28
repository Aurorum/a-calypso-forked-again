import {
	addAddOnsToCart,
	addPlanToCart,
	addWithThemePlanToCart,
	addWithPluginPlanToCart,
	createAccount,
	createSite,
	createWpForTeamsSite,
	createSiteOrDomain,
	createSiteWithCart,
	setOptionsOnSite,
	setStoreFeatures,
	setIntentOnSite,
	addDomainToCart,
	launchSiteApi,
	isPlanFulfilled,
	maybeAddStorageAddonToCart,
	isDomainFulfilled,
	maybeRemoveStepForUserlessCheckout,
	createSiteAndAddDIFMToCart,
	excludeStepIfEmailVerified,
	submitWebsiteContent,
	excludeStepIfProfileComplete,
	excludeSegmentSurveyStepIfInactive,
} from 'calypso/lib/signup/step-actions';
import { generateSteps } from './steps-pure';

export default generateSteps( {
	addAddOnsToCart,
	addPlanToCart,
	addWithThemePlanToCart,
	addWithPluginPlanToCart,
	createAccount,
	createSite,
	createWpForTeamsSite,
	createSiteOrDomain,
	createSiteWithCart,
	setOptionsOnSite,
	setStoreFeatures,
	setIntentOnSite,
	addDomainToCart,
	launchSiteApi,
	isPlanFulfilled,
	maybeAddStorageAddonToCart,
	isDomainFulfilled,
	maybeRemoveStepForUserlessCheckout,
	createSiteAndAddDIFMToCart,
	excludeStepIfEmailVerified,
	excludeStepIfProfileComplete,
	submitWebsiteContent,
	excludeSegmentSurveyStepIfInactive,
} );
