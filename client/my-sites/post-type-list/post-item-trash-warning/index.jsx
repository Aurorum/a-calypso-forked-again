import { CompactCard } from '@automattic/components';
import { useTranslate } from 'i18n-calypso';
import { useSelector } from 'calypso/state';
import { getPostTypeLabel } from 'calypso/state/post-types/selectors';
import getCurrentRoute from 'calypso/state/selectors/get-current-route';
import getPostTypeTrashUrl from 'calypso/state/selectors/get-post-type-trash-url';
import { getSelectedSiteId } from 'calypso/state/ui/selectors';

import './style.scss';

const PostItemTrashAutoDeleteWarning = ( { postType } ) => {
	const translate = useTranslate();
	const siteId = useSelector( getSelectedSiteId );
	const currentRoute = useSelector( getCurrentRoute );
	const postTrashRoute = useSelector( ( state ) => getPostTypeTrashUrl( state, postType ) );
	const postTypeLabel = useSelector( ( state ) =>
		getPostTypeLabel( state, siteId, postType, 'name' )
	);

	if ( currentRoute !== postTrashRoute ) {
		return;
	}

	return (
		<CompactCard className="post-item-trash-warning">
			<span>
				{ translate( '%(postType)s in the Trash are automatically deleted after 30 days.', {
					args: {
						postType: postTypeLabel,
					},
					comment:
						'"Trash" should have the same translation as the Navigation menu tab (eg. "Bin" in British English)',
				} ) }
			</span>
		</CompactCard>
	);
};

export default PostItemTrashAutoDeleteWarning;
