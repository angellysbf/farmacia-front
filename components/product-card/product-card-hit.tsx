import { memo, useCallback } from 'react'
import isEqual from 'react-fast-compare'
import type { WrappedInsightsClient } from 'react-instantsearch-core'
import { Highlight, connectHitInsights, Snippet } from 'react-instantsearch-dom'
import searchInsights from 'search-insights'

import type { ProductCardProps } from '@/components/product-card/product-card'
import { ProductCard } from '@/components/product-card/product-card'
import type { ProductTagType } from '@/components/product/product-tag'
import type { ViewMode } from '@/components/view-modes/view-modes'
import type { HitComponentProps, ProductHit } from '@/typings/hits'

export type ProductCardHitProps = HitComponentProps<ProductHit> & {
  insights: WrappedInsightsClient
  insightsEventName?: string
  viewMode?: ViewMode
  highlighting?: boolean
  snipetting?: boolean
}

export function ProductCardHitComponent({
  hit,
  insights,
  insightsEventName = 'PLP: Product Clicked',
  viewMode,
  highlighting = true,
  snipetting = true,
}: ProductCardHitProps) {
  const product: ProductCardProps = {
    url: `/product/${hit.objectID}?queryID=${hit.__queryID}`,
    image: hit.image_urls[0],
    price: hit.price.value,
    currency: {
      symbol: '$',
      position: 'prefix',
    },
   
  }


  // Highlighting
  if (highlighting) {
    product.labelHighlighting = () => (
      <Highlight attribute="brand" tagName="mark" hit={hit} />
    )

    product.titleHighlighting = () => (
      <Highlight attribute="name" tagName="mark" hit={hit} />
    )
  } else {
    product.label = hit.brand
    product.title = hit.name
  }

  // Snipetting
  if (snipetting) {
    product.descriptionSnippeting = () => (
      <Snippet attribute="description" hit={hit} />
    )
  } else {
    product.description = hit.description
  }

  // Tags
  if (product.reviews && product.reviews >= 90) {
    product.tags?.push({
      label: 'popular',
      theme: 'popular',
    } as ProductTagType)
  }

  // Colors
  if (hit.color.filter_group) {
    product.colors?.push(hit.color.filter_group.split(';')[1])
  }

  const handleLinkClick = useCallback(() => {
    insights('clickedObjectIDsAfterSearch', {
      eventName: insightsEventName,
    })
  }, [insights, insightsEventName])

  return (
    <ProductCard view={viewMode} onLinkClick={handleLinkClick} {...product} />
  )
}

export const ProductCardHit = connectHitInsights<ProductCardHitProps>(
  searchInsights
)(memo(ProductCardHitComponent, isEqual))

export function ProductCardHitShowcase(props: ProductCardHitProps) {
  return (
    <ProductCardHit
      {...props}
      highlighting={false}
      insightsEventName="Showcase: Product Clicked"
    />
  )
}
