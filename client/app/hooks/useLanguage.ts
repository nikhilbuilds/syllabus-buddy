import { useAuth } from "@/context/auth";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

export const useLanguage = () => {
  const { i18n } = useTranslation();
  const { user } = useAuth();

  console.log("user=============>", user);

  useEffect(() => {
    if (user?.preferredLanguage) {
      i18n.changeLanguage(user.preferredLanguage);
    }
  }, [user?.preferredLanguage, i18n]);

  return {
    currentLanguage: i18n.language,
    changeLanguage: i18n.changeLanguage,
  };
};
