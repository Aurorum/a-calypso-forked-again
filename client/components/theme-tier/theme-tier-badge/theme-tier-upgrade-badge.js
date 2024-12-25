import { getPlan } from '@automattic/calypso-products';
import { PremiumBadge } from '@automattic/components';
import { Plans } from '@automattic/data-stores';
import { createInterpolateElement } from '@wordpress/element';
import clsx from 'clsx';
import { useTranslate } from 'i18n-calypso';
import useIsUpdatedBadgeDesign from 'calypso/landing/stepper/declarative-flow/internals/steps-repository/design-setup/hooks/use-is-updated-badge-design';
import { useSelector } from 'calypso/state';
import { useThemeTierForTheme } from 'calypso/state/themes/hooks/use-theme-tier-for-theme';
import { getMarketplaceThemeSubscriptionPrices } from 'calypso/state/themes/selectors';
import { THEME_TIERS } from '../constants';
import ThemeTierBadgeCheckoutLink from './theme-tier-badge-checkout-link';
import { useThemeTierBadgeContext } from './theme-tier-badge-context';
import ThemeTierTooltipTracker from './theme-tier-tooltip-tracker';

export default function ThemeTierPlanUpgradeBadge( { showPartnerPrice } ) {
	const translate = useTranslate();
	const { themeId } = useThemeTierBadgeContext();
	const themeTier = useThemeTierForTheme( themeId );

	const tierMinimumUpsellPlan = THEME_TIERS[ themeTier?.slug ]?.minimumUpsellPlan;
	const mappedPlan = getPlan( tierMinimumUpsellPlan );
	const planPathSlug = mappedPlan?.getPathSlug();
	const subscriptionPrices = useSelector( ( state ) =>
		getMarketplaceThemeSubscriptionPrices( state, themeId )
	);

	// Using API plans because the updated getTitle() method doesn't take the experiment assignment into account.
	const plans = Plans.usePlans( { coupon: undefined } );
	const planName = plans?.data?.[ mappedPlan.getStoreSlug() ]?.productNameShort;
	const isUpdatedBadgeDesign = useIsUpdatedBadgeDesign();

	const getLabel = () => {
		if ( ! isUpdatedBadgeDesign ) {
			return translate( 'Upgrade' );
		}

		if ( showPartnerPrice && subscriptionPrices.month ) {
			const fullLabel = translate( 'Available on %(planName)s plus %(price)s/month', {
				args: {
					planName: planName,
					price: subscriptionPrices.month,
				},
			} );

			// Use shorter version if full label is too long
			const MAX_LABEL_LENGTH = 45;
			return fullLabel.length > MAX_LABEL_LENGTH
				? /* translators: This is a shorter version of the text "Available on %(planName)s plus %(price)s/month". */
				  translate( '%(planName)s + %(price)s/mo', {
						args: {
							planName: planName,
							price: subscriptionPrices.month,
						},
				  } )
				: fullLabel;
		}

		return translate( 'Available on %(planName)s', {
			args: {
				planName: planName,
			},
		} );
	};

	const tooltipContent = (
		<>
			<ThemeTierTooltipTracker />
			<div data-testid="upsell-message">
				{ createInterpolateElement(
					// Translators: %(planName)s is the name of the plan that includes this theme. Examples: "Personal" or "Premium".
					translate( 'This theme is included in the <Link>%(planName)s plan</Link>.', {
						args: { planName },
						textOnly: true,
					} ),
					{
						Link: <ThemeTierBadgeCheckoutLink plan={ planPathSlug } />,
					}
				) }
			</div>
		</>
	);

	return (
		<PremiumBadge
			className={ clsx( 'theme-tier-badge__content', {
				'theme-tier-badge__without-background': isUpdatedBadgeDesign,
			} ) }
			focusOnShow={ false }
			labelText={ getLabel() }
			tooltipClassName="theme-tier-badge-tooltip"
			tooltipContent={ tooltipContent }
			tooltipPosition="top"
			shouldHideTooltip={ isUpdatedBadgeDesign }
			isClickable={ ! isUpdatedBadgeDesign }
		/>
	);
}
