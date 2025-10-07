import { useCallback, useState } from "react";
import { api } from "~/trpc/react";
import { useNotifications } from "./useNotifications";

//TODO: Add create/update mode
export function useCompany() {
  const [company, setCompany] = useState("");
  const { addNotification } = useNotifications();

  const createCompanyMutation = api.company.createCompany.useMutation({
    onSuccess: () => {
      addNotification({
        type: "success",
        message: `Company ${company} created successfully;`,
      });
      setCompany("");
    },
    onError: (error) => {
      addNotification({
        type: "error",
        message: `Error creating company ${company}. ${error.message}`,
      });
    },
  });

  //TODO: updateCompanyMutation

  const validateForm = useCallback(() => {
    console.log("validating company form");
  }, []);

  const handleSubmit = useCallback(() => {
    validateForm();
    const payload = { companyName: company };
    //TODO: if mode == create: createCompanyMutation.mutate(payload);
    // else if mode = update: updateCompanyMutation.mutate(payload);
    createCompanyMutation.mutate(payload);
  }, [company, createCompanyMutation, validateForm]);

  return {
    company,
    setCompany,
    handleSubmit,
  };
}
