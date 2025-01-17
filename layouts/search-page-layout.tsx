import { useAtomValue } from 'jotai/utils'
import type {
  GetServerSidePropsContext,
  GetServerSidePropsResult,
  GetStaticPropsResult,
} from 'next'
import { memo, useMemo } from 'react'
import isEqual from 'react-fast-compare'

import { configAtom } from '@/config/config'
import { useUserToken } from '@/hooks/useUserToken'
import { appId, searchApiKey, indexName } from '@/utils/env'
import { getResultsState } from '@/utils/getResultsState'
import { Search } from '@instantsearch/search'
import { urlToSearchState } from '@instantsearch/utils/url'

import { searchClientAtom } from './app-layout'
import { BasicPageLayout } from './basic-page-layout'
import type { BasicPageLayoutProps } from './basic-page-layout'

export type SearchPageLayoutProps = BasicPageLayoutProps & {
  resultsState?: any
  searchState?: any
  userToken?: string
}

function SearchPageLayoutComponent({
  children,
  resultsState,
  searchState: initialSearchState,
  userToken: initialUserToken,
  ...props
}: SearchPageLayoutProps) {
  // const { searchParameters: configSearchParameters } = useAtomValue(configAtom)
  // const searchClient = useAtomValue(searchClientAtom)
  const userTokenHookValue = useUserToken()
  const userToken = userTokenHookValue ? userTokenHookValue : initialUserToken

  const searchParameters = useMemo(
    () => ({
      userToken,
      enablePersonalization: Boolean(userToken),
      // ...configSearchParameters,
    }),
    []
  )

  return (
    <BasicPageLayout>
      <Search
        indexName={indexName}
        searchClient={'searchClient'}
        searchParameters={searchParameters}
        resultsState={resultsState}
        {...props}
      >
        {children}
      </Search>
    </BasicPageLayout>
  )
}

export const SearchPageLayout = memo(SearchPageLayoutComponent, isEqual)

export type GetServerSidePropsOptions = GetServerSidePropsResult<any>
export type GetStaticPropsOptions = GetStaticPropsResult<any>

export const getPropsPage = async (
  component: React.ElementType,
  url?: string,
  options?: GetServerSidePropsOptions | GetStaticPropsOptions
) => {
  const { props, ...customOptions } = (options as { props: any }) || {}

  const searchState = urlToSearchState(url)
  const resultsState = await getResultsState({
    component,
    searchState,
    appId,
    searchApiKey,
    indexName,
    ...props,
  })

  return {
    props: {
      ...props,
      searchState,
      resultsState,
    },
    ...customOptions,
  }
}

export const getServerSidePropsPage = (
  component: React.ElementType,
  context: GetServerSidePropsContext,
  options?: GetServerSidePropsOptions,
  url?: string
) => {
  const customOptions = (options as { props: any }) || {}

  const userTokenCookie = context.req.cookies._ALGOLIA
  if (userTokenCookie) {
    customOptions.props = {
      ...customOptions.props,
      userToken: userTokenCookie,
    }
  }

  return getPropsPage(
    component,
    url || context.resolvedUrl || '',
    customOptions
  )
}

export const getStaticPropsPage = (
  component: React.ElementType,
  url?: string,
  options?: GetServerSidePropsOptions
) => getPropsPage(component, url, options)
