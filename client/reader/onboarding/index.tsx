import { recordTracksEvent } from '@automattic/calypso-analytics';
import { isEnabled } from '@automattic/calypso-config';
import page from '@automattic/calypso-router';
import { CircularProgressBar } from '@automattic/components';
import { Checklist, ChecklistItem, Task } from '@automattic/launchpad';
import { translate } from 'i18n-calypso';
import React, { useState, useEffect } from 'react';
import {
	READER_ONBOARDING_SEEN_PREFERENCE_KEY,
	READER_ONBOARDING_PREFERENCE_KEY,
	READER_ONBOARDING_TRACKS_EVENT_PREFIX,
} from 'calypso/reader/onboarding/constants';
import InterestsModal from 'calypso/reader/onboarding/interests-modal';
import SubscribeModal from 'calypso/reader/onboarding/subscribe-modal';
import { useDispatch, useSelector } from 'calypso/state';
import { getCurrentUserDate } from 'calypso/state/current-user/selectors';
import { savePreference } from 'calypso/state/preferences/actions';
import { getPreference, hasReceivedRemotePreferences } from 'calypso/state/preferences/selectors';
import { getReaderFollows } from 'calypso/state/reader/follows/selectors';
import hasCompletedReaderProfile from 'calypso/state/reader/onboarding/selectors/has-completed-reader-profile';
import { getReaderFollowedTags } from 'calypso/state/reader/tags/selectors';
import getUserSettings from 'calypso/state/selectors/get-user-settings';
import './style.scss';

const ReaderOnboarding = ( {
	onRender,
	forceShow = false,
}: {
	onRender?: ( shown: boolean ) => void;
	forceShow?: boolean;
} ) => {
	const dispatch = useDispatch();
	const [ isInterestsModalOpen, setIsInterestsModalOpen ] = useState( false );
	const [ isDiscoverModalOpen, setIsDiscoverModalOpen ] = useState( false );

	const preferencesLoaded = useSelector( hasReceivedRemotePreferences );
	const userRegistrationDate: string | null = useSelector( getCurrentUserDate );

	const followedTags = useSelector( getReaderFollowedTags );
	const follows = useSelector( getReaderFollows );
	const profileCompleted = useSelector( hasCompletedReaderProfile );
	const userSettings = useSelector( getUserSettings );

	const hasCompletedOnboarding: boolean | null = useSelector( ( state ) =>
		getPreference( state, READER_ONBOARDING_PREFERENCE_KEY )
	);
	const hasSeenOnboarding: boolean | null = useSelector( ( state ) =>
		getPreference( state, READER_ONBOARDING_SEEN_PREFERENCE_KEY )
	);

	const hasFollowedTags = followedTags !== null && followedTags.length > 2;
	const hasFollowedSites = follows?.filter( ( follow ) => ! follow.is_owner )?.length > 2;

	// If the user has completed the onboarding, save the preference and track the event.
	if ( ! hasCompletedOnboarding && hasFollowedTags && hasFollowedSites && profileCompleted ) {
		dispatch( savePreference( READER_ONBOARDING_PREFERENCE_KEY, true ) );
		recordTracksEvent( `${ READER_ONBOARDING_TRACKS_EVENT_PREFIX }completed` );
	}

	const shouldShowOnboarding =
		forceShow ||
		isEnabled( 'reader/force-onboarding' ) ||
		!! (
			preferencesLoaded &&
			! hasCompletedOnboarding &&
			userRegistrationDate &&
			new Date( userRegistrationDate ) >= new Date( '2024-10-01T00:00:00Z' )
		);

	// Modal state handlers with tracking.
	const openInterestsModal = () => {
		recordTracksEvent( `${ READER_ONBOARDING_TRACKS_EVENT_PREFIX }interests_modal_open` );
		setIsInterestsModalOpen( true );
	};

	const closeInterestsModal = () => {
		recordTracksEvent( `${ READER_ONBOARDING_TRACKS_EVENT_PREFIX }interests_modal_close` );
		setIsInterestsModalOpen( false );
		if ( ! hasSeenOnboarding ) {
			dispatch( savePreference( READER_ONBOARDING_SEEN_PREFERENCE_KEY, true ) );
		}
	};

	const openDiscoverModal = () => {
		recordTracksEvent( `${ READER_ONBOARDING_TRACKS_EVENT_PREFIX }discover_modal_open` );
		setIsDiscoverModalOpen( true );
	};

	const closeDiscoverModal = () => {
		recordTracksEvent( `${ READER_ONBOARDING_TRACKS_EVENT_PREFIX }discover_modal_close` );
		setIsDiscoverModalOpen( false );
	};

	const handleInterestsContinue = () => {
		recordTracksEvent( `${ READER_ONBOARDING_TRACKS_EVENT_PREFIX }interests_modal_continue` );
		closeInterestsModal();
		openDiscoverModal();
	};

	const itemClickHandler = ( task: Task ) => {
		recordTracksEvent( `${ READER_ONBOARDING_TRACKS_EVENT_PREFIX }task_click`, {
			task: task.id,
		} );
		task?.actionDispatch?.();
	};

	const navToAccountProfile = () => {
		recordTracksEvent( `${ READER_ONBOARDING_TRACKS_EVENT_PREFIX }complete_account_profile` );
		page( '/me?ref=reader-onboarding' );
	};

	// Track if user viewed Reader Onboarding.
	useEffect( () => {
		if ( shouldShowOnboarding ) {
			recordTracksEvent( `${ READER_ONBOARDING_TRACKS_EVENT_PREFIX }viewed` );
		}
	}, [ shouldShowOnboarding, dispatch ] );

	// Auto-open the interests modal if onboarding should render and it has never been opened before
	useEffect( () => {
		if ( shouldShowOnboarding && ! hasSeenOnboarding ) {
			openInterestsModal();
		}
	}, [ shouldShowOnboarding, hasSeenOnboarding, dispatch ] );

	// Reopen subscription onboarding page if prompted by query param.
	useEffect( () => {
		const params = new URLSearchParams( window.location.search );
		const loadSubsStep = params.get( 'reloadSubscriptionOnboarding' );
		if ( loadSubsStep ) {
			openDiscoverModal();
		}
		params.delete( 'reloadSubscriptionOnboarding' );
		window.history.replaceState(
			{},
			'',
			`${ window.location.pathname }${ params.toString() ? '?' + params.toString() : '' }`
		);
	}, [] );

	// Notify the parent component if onboarding will render.
	onRender?.( shouldShowOnboarding );

	if ( ! shouldShowOnboarding ) {
		return null;
	}

	const tasks: Task[] = [
		{
			id: 'select-interests',
			title: translate( 'Select some of your interests' ),
			actionDispatch: openInterestsModal,
			completed: hasFollowedTags,
			disabled: false,
		},
		{
			id: 'discover-sites',
			title: translate( "Discover and subscribe to sites you'll love" ),
			actionDispatch: openDiscoverModal,
			completed: hasFollowedSites,
			disabled: ! hasFollowedSites && ! hasFollowedTags,
		},
		{
			id: 'account-profile',
			title: userSettings?.has_gravatar
				? translate( 'Fill out your profile' )
				: translate( 'Add your avatar and fill out your profile' ),
			actionDispatch: navToAccountProfile,
			completed: profileCompleted,
			disabled: ! profileCompleted && ( ! hasFollowedTags || ! hasFollowedSites ),
		},
	];

	return (
		<>
			<div className="reader-onboarding">
				<div className="reader-onboarding__intro-column">
					<CircularProgressBar
						size={ 40 }
						enableDesktopScaling
						numberOfSteps={ tasks.length }
						currentStep={ tasks.filter( ( task ) => task.completed ).length }
					/>
					<h2>{ translate( 'Your personal reading adventure' ) }</h2>
					<p>{ translate( 'Tailor your feed, connect with your favorite topics.' ) }</p>
				</div>
				<div className="reader-onboarding__steps-column">
					<Checklist>
						{ tasks.map( ( task ) => (
							<ChecklistItem
								task={ task }
								key={ task.id }
								onClick={ () => itemClickHandler( task ) }
							/>
						) ) }
					</Checklist>
				</div>
			</div>

			<InterestsModal
				isOpen={ isInterestsModalOpen }
				onClose={ closeInterestsModal }
				onContinue={ handleInterestsContinue }
			/>
			<SubscribeModal isOpen={ isDiscoverModalOpen } onClose={ closeDiscoverModal } />
		</>
	);
};

export default ReaderOnboarding;
