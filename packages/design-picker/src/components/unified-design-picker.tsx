import { recordTracksEvent } from '@automattic/calypso-analytics';
import { Button } from '@automattic/components';
import clsx from 'clsx';
import { useCallback, useRef, useState } from 'react';
import { useInView } from 'react-intersection-observer';
import { SHOW_ALL_SLUG } from '../constants';
import { useFilteredDesigns } from '../hooks/use-filtered-designs';
import { getAssemblerDesign, isDefaultGlobalStylesVariationSlug } from '../utils';
import { isLockedStyleVariation } from '../utils/is-locked-style-variation';
import DesignPickerCategoryFilter from './design-picker-category-filter';
import DesignPickerTierFilter from './design-picker-tier-filter';
import DesignPreviewImage from './design-preview-image';
import NoResults from './no-results';
import PatternAssemblerCta, { usePatternAssemblerCtaData } from './pattern-assembler-cta';
import ThemeCard from './theme-card';
import type { Categorization } from '../hooks/use-categorization';
import type { Design, StyleVariation } from '../types';
import type { RefCallback } from 'react';
import './style.scss';

interface TrackDesignViewProps {
	category?: string | null;
	design: Design;
	isPremiumThemeAvailable?: boolean;
}

/**
 * Hook to return a [callback ref](https://reactjs.org/docs/refs-and-the-dom.html#callback-refs)
 * that MUST be used as the `ref` prop on a `div` element.
 * The hook ensures that we generate theme display Tracks events when the user views
 * the underlying `div` element.
 * @param { TrackDesignViewProps } designDetails Details around the design and current context.
 * @returns { Function } A callback ref that MUST be used on a div element for tracking.
 */
const useTrackDesignView = ( {
	category,
	design,
	isPremiumThemeAvailable,
}: TrackDesignViewProps ): RefCallback< HTMLDivElement > => {
	const observerRef = useRef< IntersectionObserver >();
	const [ viewedCategories, setViewedCategory ] = useState< string[] >( [] );

	// Use a callback as the ref so we get called for both mount and unmount events
	// We don't get both if we use useRef() and useEffect() together.
	return useCallback(
		( wrapperDiv: HTMLDivElement ) => {
			// If we've already viewed the design in this category,
			// we can skip setting up the handler
			if ( category && viewedCategories.includes( category ) ) {
				return;
			}

			// If we don't have a wrapper div, we aren't mounted and should remove the observer
			if ( ! wrapperDiv ) {
				observerRef.current?.disconnect?.();
				return;
			}

			const intersectionHandler = ( entries: IntersectionObserverEntry[] ) => {
				// Only fire once per category
				if ( ! wrapperDiv || ( category && viewedCategories.includes( category ) ) ) {
					return;
				}

				const [ entry ] = entries;
				if ( ! entry.isIntersecting ) {
					return;
				}

				const trackingCategory = category === SHOW_ALL_SLUG ? undefined : category;

				recordTracksEvent( 'calypso_design_picker_design_display', {
					category: trackingCategory,
					...( design?.design_tier && { design_tier: design.design_tier } ),
					is_premium: design?.design_tier === 'premium',
					// TODO: Better to track whether already available on this sites plan.
					is_premium_available: isPremiumThemeAvailable,
					slug: design.slug,
					is_virtual: design.is_virtual,
					is_externally_managed: design?.design_tier === 'partner',
				} );

				if ( category ) {
					// Mark the current and category as viewed
					setViewedCategory( ( existingCategories ) => [ ...existingCategories, category ] );
				}
			};

			observerRef.current = new IntersectionObserver( intersectionHandler, {
				// Only fire the event when 60% of the element becomes visible
				threshold: [ 0.6 ],
			} );

			observerRef.current.observe( wrapperDiv );
		},
		[ category, design, isPremiumThemeAvailable, observerRef, setViewedCategory, viewedCategories ]
	);
};

interface DesignCardProps {
	design: Design;
	locale: string;
	category?: string | null;
	isPremiumThemeAvailable?: boolean;
	shouldLimitGlobalStyles?: boolean;
	onChangeVariation: ( design: Design, variation?: StyleVariation ) => void;
	onPreview: ( design: Design, variation?: StyleVariation ) => void;
	getBadge: ( themeId: string, isLockedStyleVariation: boolean ) => React.ReactNode;
	oldHighResImageLoading?: boolean; // Temporary for A/B test.
	isActive: boolean;
}

const DesignCard: React.FC< DesignCardProps > = ( {
	design,
	locale,
	category,
	isPremiumThemeAvailable,
	shouldLimitGlobalStyles,
	onChangeVariation,
	onPreview,
	getBadge,
	oldHighResImageLoading,
	isActive,
} ) => {
	const [ selectedStyleVariation, setSelectedStyleVariation ] = useState< StyleVariation >();

	const { style_variations = [] } = design;
	const trackingDivRef = useTrackDesignView( { category, design, isPremiumThemeAvailable } );
	const isDefaultVariation = isDefaultGlobalStylesVariationSlug( selectedStyleVariation?.slug );

	const isLocked = isLockedStyleVariation( {
		isPremiumTheme: design?.design_tier === 'premium',
		styleVariationSlug: selectedStyleVariation?.slug,
		shouldLimitGlobalStyles,
	} );

	const conditionalProps =
		! isLocked && isActive
			? {}
			: { onImageClick: () => onPreview( design, selectedStyleVariation ) };

	return (
		<ThemeCard
			className="design-button-container"
			ref={ trackingDivRef }
			name={
				isDefaultVariation ? design.title : `${ design.title } – ${ selectedStyleVariation?.title }`
			}
			image={
				<DesignPreviewImage
					design={ design }
					locale={ locale }
					styleVariation={ selectedStyleVariation }
					oldHighResImageLoading={ oldHighResImageLoading }
				/>
			}
			badge={ getBadge( design.slug, isLocked ) }
			styleVariations={ style_variations }
			selectedStyleVariation={ selectedStyleVariation }
			onStyleVariationClick={ ( variation ) => {
				onChangeVariation( design, variation );
				setSelectedStyleVariation( variation );
			} }
			onStyleVariationMoreClick={ () => onPreview( design ) }
			isActive={ isActive && ! isLocked }
			{ ...conditionalProps }
		/>
	);
};

interface DesignPickerProps {
	locale: string;
	onDesignYourOwn: ( design: Design ) => void;
	onClickDesignYourOwnTopButton: ( design: Design ) => void;
	onPreview: ( design: Design, variation?: StyleVariation ) => void;
	onChangeVariation: ( design: Design, variation?: StyleVariation ) => void;
	designs: Design[];
	categorization?: Categorization;
	isPremiumThemeAvailable?: boolean;
	shouldLimitGlobalStyles?: boolean;
	getBadge: ( themeId: string, isLockedStyleVariation: boolean ) => React.ReactNode;
	oldHighResImageLoading?: boolean; // Temporary for A/B test
	isSiteAssemblerEnabled?: boolean; // Temporary for A/B test
	siteActiveTheme?: string | null;
	showActiveThemeBadge?: boolean;
	isTierFilterEnabled?: boolean;
}

const DesignPicker: React.FC< DesignPickerProps > = ( {
	locale,
	onDesignYourOwn,
	onClickDesignYourOwnTopButton,
	onPreview,
	onChangeVariation,
	designs,
	categorization,
	isPremiumThemeAvailable,
	shouldLimitGlobalStyles,
	getBadge,
	oldHighResImageLoading,
	isSiteAssemblerEnabled,
	siteActiveTheme = null,
	showActiveThemeBadge = false,
	isTierFilterEnabled = false,
} ) => {
	const hasCategories = !! Object.keys( categorization?.categories || {} ).length;
	const filteredDesigns = useFilteredDesigns( designs, categorization );

	// Pick design

	const assemblerCtaData = usePatternAssemblerCtaData();

	return (
		<div>
			<div className="design-picker__filters">
				{ categorization && hasCategories && (
					<DesignPickerCategoryFilter
						className="design-picker__category-filter"
						categories={ categorization.categories }
						onSelect={ categorization.onSelect }
						selectedSlug={ categorization.selection }
					/>
				) }
				{ assemblerCtaData.shouldGoToAssemblerStep && isSiteAssemblerEnabled && (
					<Button
						className={ clsx( 'design-picker__design-your-own-button', {
							'design-picker__design-your-own-button-without-categories': ! hasCategories,
						} ) }
						onClick={ () => onClickDesignYourOwnTopButton( getAssemblerDesign() ) }
					>
						{ assemblerCtaData.title }
					</Button>
				) }
				{ isTierFilterEnabled && <DesignPickerTierFilter /> }
			</div>

			<div className="design-picker__grid">
				{ filteredDesigns.map( ( design, index ) => {
					return (
						<DesignCard
							key={ design.recipe?.slug ?? design.slug ?? index }
							category={ categorization?.selection }
							design={ design }
							locale={ locale }
							isPremiumThemeAvailable={ isPremiumThemeAvailable }
							shouldLimitGlobalStyles={ shouldLimitGlobalStyles }
							onChangeVariation={ onChangeVariation }
							onPreview={ onPreview }
							getBadge={ getBadge }
							oldHighResImageLoading={ oldHighResImageLoading }
							isActive={ showActiveThemeBadge && design.recipe?.stylesheet === siteActiveTheme }
						/>
					);
				} ) }
				{ filteredDesigns.length === 0 && <NoResults /> }
				{ isSiteAssemblerEnabled && (
					<PatternAssemblerCta onButtonClick={ () => onDesignYourOwn( getAssemblerDesign() ) } />
				) }
			</div>
		</div>
	);
};

export interface UnifiedDesignPickerProps {
	locale: string;
	onDesignYourOwn: ( design: Design ) => void;
	onClickDesignYourOwnTopButton: ( design: Design ) => void;
	onPreview: ( design: Design, variation?: StyleVariation ) => void;
	onChangeVariation: ( design: Design, variation?: StyleVariation ) => void;
	onViewAllDesigns: () => void;
	designs: Design[];
	categorization?: Categorization;
	heading?: React.ReactNode;
	isPremiumThemeAvailable?: boolean;
	shouldLimitGlobalStyles?: boolean;
	getBadge: ( themeId: string, isLockedStyleVariation: boolean ) => React.ReactNode;
	oldHighResImageLoading?: boolean; // Temporary for A/B test
	isSiteAssemblerEnabled?: boolean; // Temporary for A/B test
	siteActiveTheme?: string | null;
	showActiveThemeBadge?: boolean;
	isTierFilterEnabled?: boolean;
}

const UnifiedDesignPicker: React.FC< UnifiedDesignPickerProps > = ( {
	locale,
	onDesignYourOwn,
	onClickDesignYourOwnTopButton,
	onPreview,
	onChangeVariation,
	onViewAllDesigns,
	designs,
	heading,
	categorization,
	isPremiumThemeAvailable,
	shouldLimitGlobalStyles,
	getBadge,
	oldHighResImageLoading,
	isSiteAssemblerEnabled,
	siteActiveTheme = null,
	showActiveThemeBadge = false,
	isTierFilterEnabled = false,
} ) => {
	const hasCategories = !! Object.keys( categorization?.categories || {} ).length;

	const { ref } = useInView( {
		onChange: ( inView ) => {
			if ( inView ) {
				onViewAllDesigns();
			}
		},
	} );
	// eslint-disable-next-line wpcalypso/jsx-classname-namespace
	const bottomAnchorContent = <div className="design-picker__bottom_anchor" ref={ ref }></div>;

	return (
		<div
			className={ clsx( 'design-picker', `design-picker--theme-light`, 'design-picker__unified', {
				'design-picker--has-categories': hasCategories,
			} ) }
		>
			{ heading }
			<div className="unified-design-picker__designs">
				<DesignPicker
					locale={ locale }
					onDesignYourOwn={ onDesignYourOwn }
					onClickDesignYourOwnTopButton={ onClickDesignYourOwnTopButton }
					onPreview={ onPreview }
					onChangeVariation={ onChangeVariation }
					designs={ designs }
					categorization={ categorization }
					isPremiumThemeAvailable={ isPremiumThemeAvailable }
					shouldLimitGlobalStyles={ shouldLimitGlobalStyles }
					getBadge={ getBadge }
					oldHighResImageLoading={ oldHighResImageLoading }
					isSiteAssemblerEnabled={ isSiteAssemblerEnabled }
					siteActiveTheme={ siteActiveTheme }
					showActiveThemeBadge={ showActiveThemeBadge }
					isTierFilterEnabled={ isTierFilterEnabled }
				/>
				{ bottomAnchorContent }
			</div>
		</div>
	);
};

export { UnifiedDesignPicker as default };
