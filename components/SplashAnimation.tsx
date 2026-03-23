import React, { useEffect } from "react";
import { View, Image, StyleSheet, Text } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  withSequence,
  Easing,
  runOnJS,
} from "react-native-reanimated";

interface Props {
  onFinish: () => void;
}

export function SplashAnimation({ onFinish }: Props) {
  const logoScale = useSharedValue(0.25);
  const logoOpacity = useSharedValue(0);
  const glowOpacity = useSharedValue(0);
  const glowScale = useSharedValue(0.5);
  const titleOpacity = useSharedValue(0);
  const titleY = useSharedValue(24);
  const subtitleOpacity = useSharedValue(0);
  const containerOpacity = useSharedValue(1);
  const ringScale = useSharedValue(0.6);
  const ringOpacity = useSharedValue(0);

  useEffect(() => {
    logoOpacity.value = withTiming(1, { duration: 450, easing: Easing.out(Easing.ease) });
    logoScale.value = withSpring(1, { damping: 11, stiffness: 100, mass: 0.9 });

    glowOpacity.value = withDelay(200, withSequence(
      withTiming(0.55, { duration: 600 }),
      withTiming(0.2, { duration: 800 }),
    ));
    glowScale.value = withDelay(200, withSpring(1.2, { damping: 10, stiffness: 60 }));

    ringOpacity.value = withDelay(300, withSequence(
      withTiming(0.35, { duration: 500 }),
      withTiming(0, { duration: 700 }),
    ));
    ringScale.value = withDelay(300, withTiming(1.8, { duration: 1200, easing: Easing.out(Easing.ease) }));

    titleOpacity.value = withDelay(650, withTiming(1, { duration: 500 }));
    titleY.value = withDelay(650, withSpring(0, { damping: 14, stiffness: 120 }));

    subtitleOpacity.value = withDelay(950, withTiming(1, { duration: 550 }));

    containerOpacity.value = withDelay(2500, withTiming(0, {
      duration: 550,
      easing: Easing.in(Easing.ease),
    }, (finished) => {
      if (finished) runOnJS(onFinish)();
    }));
  }, []);

  const logoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.value }],
    opacity: logoOpacity.value,
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
    transform: [{ scale: glowScale.value }],
  }));

  const ringStyle = useAnimatedStyle(() => ({
    opacity: ringOpacity.value,
    transform: [{ scale: ringScale.value }],
  }));

  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleY.value }],
  }));

  const subtitleStyle = useAnimatedStyle(() => ({
    opacity: subtitleOpacity.value,
  }));

  const containerStyle = useAnimatedStyle(() => ({
    opacity: containerOpacity.value,
  }));

  return (
    <Animated.View style={[styles.container, containerStyle]}>
      <View style={styles.center}>
        <View style={styles.logoWrapper}>
          <Animated.View style={[styles.ring, ringStyle]} />
          <Animated.View style={[styles.glow, glowStyle]} />
          <Animated.View style={logoStyle}>
            <Image
              source={require("@/assets/images/icon.png")}
              style={styles.logo}
              resizeMode="contain"
            />
          </Animated.View>
        </View>

        <Animated.View style={titleStyle}>
          <Text style={styles.title}>LeadLocker</Text>
        </Animated.View>

        <Animated.View style={subtitleStyle}>
          <Text style={styles.subtitle}>REAL ESTATE CRM</Text>
        </Animated.View>
      </View>

      <Animated.View style={[styles.bottomLine, subtitleStyle]}>
        <View style={styles.line} />
        <Text style={styles.tagline}>Unlock Every Deal</Text>
        <View style={styles.line} />
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#0A1628",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
  },
  center: {
    alignItems: "center",
  },
  logoWrapper: {
    alignItems: "center",
    justifyContent: "center",
    width: 180,
    height: 180,
    marginBottom: 24,
  },
  ring: {
    position: "absolute",
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 1.5,
    borderColor: "#C87941",
    opacity: 0,
  },
  glow: {
    position: "absolute",
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "#1B3A7A",
  },
  logo: {
    width: 128,
    height: 128,
    borderRadius: 26,
  },
  title: {
    fontSize: 38,
    color: "#FFFFFF",
    fontFamily: "Inter_700Bold",
    letterSpacing: -1,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 12,
    color: "#C87941",
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 3.5,
    textAlign: "center",
    marginTop: 8,
  },
  bottomLine: {
    position: "absolute",
    bottom: 60,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 40,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: "#1E3050",
  },
  tagline: {
    fontSize: 11,
    color: "#334155",
    fontFamily: "Inter_400Regular",
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
});
