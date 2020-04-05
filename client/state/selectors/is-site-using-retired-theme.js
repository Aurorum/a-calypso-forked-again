/**
 * Internal dependencies
 */
import { get } from 'lodash';
import { getActiveTheme } from 'state/themes/selectors/get-active-theme';

/**
 * Returns true if the site is currently using a retired theme.
 *
 * @param  {object}   state    Global state tree
 * @param  {number}   siteId   The ID of the site we're querying
 * @returns {?boolean}          Whether the current theme is retired.
 */
export default function isSiteUsingRetiredTheme( state, siteId ) {
	return get( state, 'themes.queries.wpcom.data.items.' + getActiveTheme( state, siteId ) + '.retired', false );
}
