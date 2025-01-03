import pagejs from '@automattic/calypso-router';
import { Button } from '@wordpress/components';
import { filterSortAndPaginate } from '@wordpress/dataviews';
import { useTranslate } from 'i18n-calypso';
import { useEffect, useMemo, useState } from 'react';
import { initialDataViewsState } from 'calypso/a8c-for-agencies/components/items-dashboard/constants';
import { DataViewsState } from 'calypso/a8c-for-agencies/components/items-dashboard/items-dataviews/interfaces';
import QueryDotorgPlugins from 'calypso/components/data/query-dotorg-plugins';
import { DataViews } from 'calypso/components/dataviews';
import { recordTracksEvent } from 'calypso/state/analytics/actions';
import { PLUGINS_STATUS } from 'calypso/state/plugins/installed/status/constants';
import { Plugin } from 'calypso/state/plugins/installed/types';
import { useActions } from './use-actions';
import { useFields } from './use-fields';
import './style.scss';

interface Props {
	pluginSlug: string | null;
	currentPlugins: Array< Plugin >;
	initialSearch?: string;
	isLoading: boolean;
	onSearch?: ( search: string ) => void;
	bulkActionDialog: ( action: string, plugins: Array< Plugin > ) => void;
}

const defaultLayouts = { table: {} };

const pluginsListFields = [ 'plugins', 'sites', 'update' ];
const pluginViewFields = [ 'plugins' ];

const getFieldsPerView = ( pluginSlug: string | null ) => {
	if ( pluginSlug ) {
		return pluginViewFields;
	}
	return pluginsListFields;
};

const openPluginSitesPane = ( plugin: Plugin ) => {
	recordTracksEvent( 'calypso_plugins_list_open_plugin_sites_pane', {
		plugin: plugin.slug,
	} );
	pagejs.show( `/plugins/manage/sites/${ plugin.slug }` );
};

export default function PluginsListDataViews( {
	pluginSlug,
	currentPlugins,
	initialSearch,
	isLoading,
	onSearch,
	bulkActionDialog,
}: Props ) {
	const translate = useTranslate();
	const pluginUpdateCount = currentPlugins.filter(
		( plugin ) => plugin.status?.includes( PLUGINS_STATUS.UPDATE )
	).length;

	const fields = useFields( bulkActionDialog, openPluginSitesPane );
	const actions = useActions( bulkActionDialog );

	const [ dataViewsState, setDataViewsState ] = useState< DataViewsState >( () => ( {
		...initialDataViewsState,
		perPage: 15,
		search: initialSearch,
		fields: getFieldsPerView( pluginSlug ),
		layout: {
			styles: {
				plugins: {
					width: '60%',
					minWidth: '300px',
				},
				sites: {
					width: '70px',
				},
				update: {
					minWidth: '200px',
				},
				actions: {
					width: '50px',
				},
			},
		},
	} ) );

	const [ isFilteringUpdates, setIsFilteringUpdates ] = useState( false );

	const header = (
		<>
			{ pluginUpdateCount > 0 && (
				<Button
					isPressed={ isFilteringUpdates }
					onClick={ () => {
						if ( isFilteringUpdates ) {
							setDataViewsState( {
								...dataViewsState,
								filters: [],
								page: 1,
							} );
						} else {
							setDataViewsState( {
								...dataViewsState,
								filters: [
									{
										field: 'status',
										operator: 'isAny',
										value: [ PLUGINS_STATUS.UPDATE ],
									},
								],
								page: 1,
							} );
						}
						setIsFilteringUpdates( ! isFilteringUpdates );
					} }
				>
					{ translate( 'Pending update (%s)', { args: [ pluginUpdateCount ] } ) }
				</Button>
			) }
		</>
	);

	useEffect( () => {
		if ( dataViewsState.search !== initialSearch ) {
			onSearch && onSearch( dataViewsState.search || '' );
		}
	}, [ dataViewsState.search, onSearch, initialSearch ] );

	useEffect( () => {
		// Sets the correct fields when route changes
		setDataViewsState( {
			...dataViewsState,
			fields: getFieldsPerView( pluginSlug ),
		} );
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ pluginSlug ] );

	useEffect( () => {
		if (
			dataViewsState.filters?.length === 1 &&
			dataViewsState.filters[ 0 ].field === 'status' &&
			dataViewsState.filters[ 0 ].value?.includes( PLUGINS_STATUS.UPDATE )
		) {
			setIsFilteringUpdates( true );
		} else {
			setIsFilteringUpdates( false );
		}
	}, [ dataViewsState.filters ] );

	const { data, paginationInfo } = useMemo( () => {
		const result = filterSortAndPaginate( currentPlugins, dataViewsState, fields );

		return {
			data: result.data,
			paginationInfo: result.paginationInfo,
		};
	}, [ currentPlugins, dataViewsState, fields ] );

	return (
		<>
			<QueryDotorgPlugins pluginSlugList={ data.map( ( plugin ) => plugin.slug ) } />
			<DataViews
				data={ data }
				view={ dataViewsState }
				onChangeView={ setDataViewsState }
				fields={ fields }
				search
				searchLabel={ translate( 'Search' ) }
				actions={ pluginSlug ? [] : actions }
				isLoading={ isLoading }
				paginationInfo={ paginationInfo }
				defaultLayouts={ defaultLayouts }
				header={ header }
			/>
		</>
	);
}
