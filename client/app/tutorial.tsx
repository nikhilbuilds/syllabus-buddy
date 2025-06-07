import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Dimensions,
  SafeAreaView,
} from "react-native";
import { useTranslation } from "react-i18next";
import { Stack } from "expo-router";
import { darkTheme } from "@/constants/theme";

const { width } = Dimensions.get("window");

interface TutorialStep {
  title: string;
  description: string;
  image: any;
}

export default function TutorialScreen() {
  const { t } = useTranslation();

  const steps: TutorialStep[] = [
    {
      title: t("tutorial.step1.title"),
      description: t("tutorial.step1.description"),
      image: require("../assets/tutorial/step1.png"),
    },
    {
      title: t("tutorial.step2.title"),
      description: t("tutorial.step2.description"),
      image: require("../assets/tutorial/step2.png"),
    },
    {
      title: t("tutorial.step3.title"),
      description: t("tutorial.step3.description"),
      image: require("../assets/tutorial/step3.png"),
    },
    {
      title: t("tutorial.step4.title"),
      description: t("tutorial.step4.description"),
      image: require("../assets/tutorial/step4.png"),
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen
        options={{
          title: t("tutorial.title"),
          headerStyle: {
            backgroundColor: darkTheme.colors.background,
          },
          headerTintColor: darkTheme.colors.text,
        }}
      />
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.subtitle}>{t("tutorial.subtitle")}</Text>
        </View>

        <View style={styles.stepsContainer}>
          {steps.map((step, index) => (
            <View key={index} style={styles.step}>
              <View style={styles.stepHeader}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>{index + 1}</Text>
                </View>
                <Text style={styles.stepTitle}>{step.title}</Text>
              </View>

              <Image
                source={step.image}
                style={styles.stepImage}
                resizeMode="contain"
              />

              <Text style={styles.stepDescription}>{step.description}</Text>

              {index < steps.length - 1 && <View style={styles.divider} />}
            </View>
          ))}
        </View>

        <View style={styles.tipsContainer}>
          <Text style={styles.tipsTitle}>{t("tutorial.tips.title")}</Text>
          <View style={styles.tip}>
            <Text style={styles.tipText}>• {t("tutorial.tips.tip1")}</Text>
          </View>
          <View style={styles.tip}>
            <Text style={styles.tipText}>• {t("tutorial.tips.tip2")}</Text>
          </View>
          <View style={styles.tip}>
            <Text style={styles.tipText}>• {t("tutorial.tips.tip3")}</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: darkTheme.colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: darkTheme.colors.background,
  },
  header: {
    padding: 20,
    backgroundColor: darkTheme.colors.card,
    borderBottomWidth: 1,
    borderBottomColor: darkTheme.colors.border,
  },
  subtitle: {
    fontSize: 16,
    color: darkTheme.colors.textSecondary,
  },
  stepsContainer: {
    padding: 20,
  },
  step: {
    marginBottom: 30,
  },
  stepHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  stepNumber: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: darkTheme.colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  stepNumberText: {
    color: darkTheme.colors.text,
    fontSize: 16,
    fontWeight: "bold",
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: darkTheme.colors.text,
  },
  stepImage: {
    width: width - 40,
    height: 200,
    borderRadius: 10,
    marginBottom: 15,
  },
  stepDescription: {
    fontSize: 16,
    color: darkTheme.colors.textSecondary,
    lineHeight: 24,
  },
  divider: {
    height: 1,
    backgroundColor: darkTheme.colors.border,
    marginVertical: 20,
  },
  tipsContainer: {
    padding: 20,
    backgroundColor: darkTheme.colors.card,
    margin: 20,
    borderRadius: 10,
  },
  tipsTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: darkTheme.colors.text,
    marginBottom: 15,
  },
  tip: {
    marginBottom: 10,
  },
  tipText: {
    fontSize: 16,
    color: darkTheme.colors.textSecondary,
    lineHeight: 24,
  },
});
