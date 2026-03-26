import * as React from 'react';
import { Animated, Platform, Pressable, StyleSheet, View } from 'react-native';
import Svg, {
  Defs,
  G,
  LinearGradient,
  Path,
  Stop,
  Image as SvgImage,
  Text as SvgText,
} from 'react-native-svg';

import { ThemedText } from '@/components/themed-text';

type WheelItem = {
  id: string;
  label: string;
  image?: string | null;
};

type WheelProps = {
  items: WheelItem[];
  rotation: Animated.AnimatedInterpolation<string | number>;
  onPress?: () => void;
  disabled?: boolean;
};

const SIZE = 360;
const RADIUS = SIZE / 2;
const CENTER = RADIUS;

const SEGMENT_COLORS = [
  '#4f46e5',
  '#ec4899',
  '#22c55e',
  '#f97316',
  '#0ea5e9',
  '#a855f7',
];

function polarToCartesian(cx: number, cy: number, radius: number, angleInRadians: number) {
  return {
    x: cx + radius * Math.sin(angleInRadians),
    y: cy - radius * Math.cos(angleInRadians),
  };
}

export function Wheel({ items, rotation, onPress, disabled }: WheelProps) {
  const safeItems = items.length > 0 ? items : [{ id: 'placeholder', label: 'Eleman ekle' }];
  const sliceAngle = (2 * Math.PI) / safeItems.length;

  // Eleman sayısına göre pointer boyutunu ayarla:
  // Az eleman -> daha büyük, çok eleman -> daha küçük.
  const count = safeItems.length || 1;
  const pointerLength = Math.max(18, 44 - count * 1.5);
  const pointerBase = pointerLength * 0.9;

  return (
    <View style={styles.root}>
      <View
        style={[
          styles.pointer,
          {
            top: -pointerLength * 0.25,
            marginLeft: -pointerBase / 2,
            borderLeftWidth: pointerBase / 2,
            borderRightWidth: pointerBase / 2,
            // borderBottomWidth: pointerLength,
            borderTopWidth: pointerLength,
          },
        ]}
      />
      <Animated.View
        style={[
          styles.wheelShadow,
          {
            transform: [{ rotate: rotation }],
          },
        ]}>
        <Svg width={SIZE} height={SIZE}>
          <Defs>
            <LinearGradient id="wheelBg" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor="#0f172a" stopOpacity="1" />
              <Stop offset="1" stopColor="#020617" stopOpacity="1" />
            </LinearGradient>
          </Defs>

          <Path
            d={`M ${CENTER} ${CENTER} m -${RADIUS}, 0 a ${RADIUS},${RADIUS} 0 1,0 ${
              SIZE
            },0 a ${RADIUS},${RADIUS} 0 1,0 -${SIZE},0`}
            fill="url(#wheelBg)"
          />

          {safeItems.map((item, index) => {
            const startAngle = index * sliceAngle;
            const endAngle = startAngle + sliceAngle;
            const midAngle = startAngle + sliceAngle / 2;

            const start = polarToCartesian(CENTER, CENTER, RADIUS, startAngle);
            const end = polarToCartesian(CENTER, CENTER, RADIUS, endAngle);

            const largeArcFlag = sliceAngle > Math.PI ? 1 : 0;
            const d = [
              `M ${CENTER} ${CENTER}`,
              `L ${start.x} ${start.y}`,
              `A ${RADIUS} ${RADIUS} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`,
              'Z',
            ].join(' ');

            const labelRadius = RADIUS * 0.7;
            const labelPos = polarToCartesian(CENTER, CENTER, labelRadius, midAngle);

            const imageSize = 32;
            const imageRadius = RADIUS * 0.6;
            const imagePos = polarToCartesian(CENTER, CENTER, imageRadius, midAngle);

            const color = SEGMENT_COLORS[index % SEGMENT_COLORS.length];

            return (
              <G key={item.id}>
                <Path d={d} fill={color} opacity={0.9} />
                {item.image && (
                  <SvgImage
                    href={{ uri: item.image }}
                    x={imagePos.x - imageSize / 2}
                    y={imagePos.y - imageSize / 2}
                    width={imageSize}
                    height={imageSize}
                    preserveAspectRatio="xMidYMid slice"
                  />
                )}
                <SvgText
                  x={labelPos.x}
                  y={labelPos.y + (item.image ? 18 : 0)}
                  fill="#ffffff"
                  fontSize={12}
                  fontWeight="600"
                  textAnchor="middle"
                  alignmentBaseline="middle">
                  {item.label}
                </SvgText>
              </G>
            );
          })}
        </Svg>

        <Pressable
          onPress={onPress}
          disabled={disabled}
          style={({ pressed }) => [
            styles.centerCircle,
            (pressed || disabled) && styles.centerCirclePressed,
          ]}>
          <ThemedText type="smallBold" style={styles.centerText}>
            Çevir
          </ThemedText>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  wheelShadow: {
    width: SIZE,
    height: SIZE,
    borderRadius: RADIUS,
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
    overflow: Platform.OS === 'android' ? 'hidden' : 'visible',
  },
  pointer: {
    position: 'absolute',
    left: '50%',
    width: 0,
    height: 0,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#facc15',
    zIndex: 10,
  },
  centerCircle: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 80,
    height: 80,
    marginLeft: -40,
    marginTop: -40,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#020617',
    borderWidth: 3,
    borderColor: '#e5e7eb',
  },
  centerText: {
    textAlign: 'center',
    letterSpacing: 1,
    color: '#ffffff',
  },
  centerCirclePressed: {
    opacity: 0.85,
  },
});

