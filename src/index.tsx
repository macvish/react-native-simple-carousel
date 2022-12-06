import * as React from 'react'
import {
  Animated,
  FlatList,
  FlatListProps,
  ListRenderItem,
  NativeModules,
  View,
  ViewToken,
} from 'react-native'

import Pagination from './pagination'

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList)

export interface CarouselProps extends FlatListProps<{}> {
  data: Array<{}>
  renderItem: ListRenderItem<any>
  onSnapToItem?: (item: {}) => void
  itemWidth: number
  bounces?: boolean
  pagination?: boolean
  paginationColor?: string
  paginationType?: 'default' | 'circle'
  autoplay?: boolean
  autoplayDelay?: number
  placeholderContent?: React.ReactNode
  getCurrentIndex?: (value: number) => void
}

export const Carousel: React.FC<CarouselProps> = ({
  bounces,
  data,
  itemWidth,
  onSnapToItem,
  pagination,
  paginationColor,
  paginationType,
  renderItem,
  autoplay = false,
  autoplayDelay,
  placeholderContent,
  getCurrentIndex,
  ...props
}) => {
  const [currentIndex, setCurrentIndex] = React.useState<number>(0)
  const [didReachEnd, setDidReachEnd] = React.useState<boolean>(false)
  const slidesRef = React.useRef<FlatList<{}>>(null)
  const scrollX = React.useRef(new Animated.Value(0)).current
  const viewabilityConfig = React.useRef({
    viewAreaCoveragePercentThreshold: 70,
    waitForInteraction: true,
  }).current

  const onEndReacted = () => {
    setCurrentIndex((prevState) => prevState + 1)
    setDidReachEnd(true)
  }

  const onViewableItemsChanged = React.useCallback(
    ({
      changed,
      viewableItems,
    }: {
      viewableItems: Array<ViewToken>
      changed: Array<ViewToken>
    }) => {
      console.log({ viewableItems, changed })
      if (changed && changed.length > 0) {
        const index = changed[0].index as number
        console.log({ index })
        setCurrentIndex(index - 1)
        if (index < data.length) {
          setDidReachEnd(false)
        }
      }
    },
    [data]
  )

  const viewabilityConfigCallbackPairs = React.useRef([
    { viewabilityConfig, onViewableItemsChanged },
  ])

  const getItemLayout = (_data: any, index: number) => ({
    length: itemWidth,
    offset: itemWidth * (index - 1),
    index,
  })

  React.useEffect(() => {
    onSnapToItem?.(data[currentIndex])
    getCurrentIndex?.(currentIndex)
  }, [currentIndex, data, onSnapToItem, getCurrentIndex])

  React.useEffect(() => {
    let timer: NodeJS.Timeout
    if (autoplay) {
      timer = setTimeout(() => {
        if (didReachEnd) {
          slidesRef.current?.scrollToIndex({
            index: 0,
            animated: true,
          })
        } else {
          slidesRef.current?.scrollToIndex({
            index: currentIndex + 1,
            animated: true,
          })
        }
      }, autoplayDelay ?? 2500)
    }

    return () => clearTimeout(timer)
  }, [autoplay, autoplayDelay, currentIndex, didReachEnd])

  return (
    <>
      <AnimatedFlatList
        {...props}
        ref={slidesRef}
        data={data}
        extraData={data}
        renderItem={(itemProps) => (
          <View style={{ width: itemWidth }} key={itemProps.index}>
            {renderItem(itemProps)}
          </View>
        )}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        ListEmptyComponent={() => (
          <View style={{ width: itemWidth }}>{placeholderContent}</View>
        )}
        getItemLayout={getItemLayout}
        horizontal
        pagingEnabled
        bounces={bounces}
        showsHorizontalScrollIndicator={false}
        snapToInterval={itemWidth}
        snapToAlignment='start'
        renderToHardwareTextureAndroid
        scrollEventThrottle={32}
        decelerationRate={0}
        style={{ width: itemWidth }}
        viewabilityConfigCallbackPairs={viewabilityConfigCallbackPairs.current}
        onEndReached={onEndReacted}
        onEndReachedThreshold={0.5}
        keyExtractor={(_, index) => index.toString()}
        initialScrollIndex={0}
      />
      {pagination && data?.length > 1 && (
        <Pagination
          data={data}
          activeIndex={scrollX}
          paginationType={paginationType}
          color={paginationColor}
        />
      )}
    </>
  )
}

export default NativeModules.RNBasicCarouselModule
