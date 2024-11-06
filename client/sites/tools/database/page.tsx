import { useTranslate } from 'i18n-calypso';
import NavigationHeader from 'calypso/components/navigation-header';
import Notice from 'calypso/components/notice';
import { useAreAdvancedHostingFeaturesSupported } from 'calypso/sites/features';
import PhpMyAdminForm from './form';

import './style.scss';

function Container( { children }: { children: React.ReactNode } ) {
	return children;
}

function Description( { children }: { children?: React.ReactNode } ) {
	const translate = useTranslate();
	return <NavigationHeader title={ translate( 'Database' ) } subtitle={ children } />;
}

export default function Database() {
	const translate = useTranslate();

	const isSupported = useAreAdvancedHostingFeaturesSupported();
	if ( isSupported === null ) {
		return null;
	}

	const renderNotSupportedNotice = () => {
		return (
			<>
				<Description />
				<Notice showDismiss={ false } status="is-warning">
					{ translate( 'This setting is not supported for this site.' ) }
				</Notice>
			</>
		);
	};

	const renderSetting = () => {
		return (
			<PhpMyAdminForm
				disabled={ false }
				ContainerComponent={ Container }
				DescriptionComponent={ Description }
			/>
		);
	};

	return (
		<div className="tools-database phpmyadmin-card">
			{ isSupported ? renderSetting() : renderNotSupportedNotice() }
		</div>
	);
}
