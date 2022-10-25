import { useEffect, useState } from "react";


import {  useForm } from "react-hook-form";
import { ButtonHeron, Input } from "../components/index";
import { loginFields } from "../constants/formFields";
import { useAuth } from "../contexts/auth";

const fields = loginFields;
const fieldsState: any = {};
fields.forEach((field: any) => (fieldsState[field.id] = ""));

interface FormProps {
  login: string;
  senha: string;
}

export default function Login() {
  const defaultValues = {
    login: "",
    senha: "",
  };

  const [checkState, setCheck] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const {
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    control,
  } = useForm<FormProps>({ defaultValues });
  const { Login } = useAuth();

  const onSubmit = async ({login, senha}: FormProps) => {
    setLoading(true)
    await Login({login, senha});
    setLoading(false)
  };

  const handleRememberPassword = async (checked: boolean) => {
    setCheck(checked);

    localStorage.setItem("rememberCheck", JSON.stringify(checked));
    if (checked) {
      localStorage.setItem("rememberCheck", 'true');
      localStorage.setItem(
        "rememberLogin",
        JSON.stringify({ login: watch("login"), senha: watch("senha") })
      );
    } else {
      localStorage.removeItem("rememberLogin");
      localStorage.setItem("rememberCheck", 'false');
    }
  };

  useEffect(() => {
    const rememberLogin = localStorage.getItem("rememberLogin");
    if (rememberLogin) {
      const { login, senha } = JSON.parse(rememberLogin);
      setCheck(true);
      setValue("login", login);
      setValue("senha", senha);
    }
  }, []);

  return (
    <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
      <div >
        {fields.map((item: any) => (
          <Input
            key={item.id}
            id={item.id}
            type={item.type}
            labelText={item.labelText}
            control={control}
            validate={item.validate}
            errors={errors}
          />
        ))}
      </div>

      <Input
        id="checkbox-login"
        labelText="Lembrar login"
        type="checkbox"
        control={control}
        onChange={handleRememberPassword}
        value={checkState}
      />

      <ButtonHeron
        text="Entrar"
        type="primary"
        size="full"
        onClick={handleSubmit(onSubmit)}
        loading={loading}
      /> 

    </form>
  );
}
