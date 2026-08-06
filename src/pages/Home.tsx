import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { ButtonHeron, Card, Input, TextSubtext } from '../components/index';
import { useToast } from '../contexts/toast';
import { update } from '../server';
import { buildErrorToast } from '../util/error';
import { permissionAuth } from '../contexts/permission';
import Dashboard from './Dashboard';

export default function Home() {
  // Dashboard operacional embutido na home (não é rota própria) — só
  // aparece pra quem tem a tag DASHBOARD (perfis Administrador e Developer,
  // este último via bypass de hasPermition). Ver Dashboard.tsx.
  const { hasPermition } = permissionAuth();
  const [user, setUser] = useState() as any;
  const [disabled, setDisabled] = useState(false);
  const { renderToast } = useToast();

  const {
    reset,
    handleSubmit,
    formState: { errors },
    control,
  } = useForm();

  const renderUser = () => {
    const auth: any = sessionStorage.getItem('auth');
    const parse = JSON.parse(auth);
    setUser(parse);
  };

  const handleResetSenha = async (senha: any) => {
    setDisabled(true);
    try {
      // PUT /usuarios/reset-senha troca sempre a senha do usuário do token
      // (não recebe id/login no corpo) e responde 200 com corpo vazio.
      await update(`/usuarios/reset-senha`, senha);
      reset();
      renderToast({
        type: 'success',
        title: '',
        message: 'Senha alterada com sucesso!',
        open: true,
      });
    } catch (error) {
      renderToast(buildErrorToast(error, 'Não foi possível alterar a senha.'));
      reset();
    } finally {
      setDisabled(false);
    }
  };

  useEffect(() => {
    renderUser();
  }, []);

  return (
    <>
      <Card>
        <div className="grid sm:grid-cols-2">
          <TextSubtext
            text={user?.nome}
            subtext={user?.login}
            color="violet"
            size="md"
            icon="pi pi-id-card"
            display="grid"
          />
          <div className="flex gap-2  my-6 sm:my-0  items-center">
            <Input
              labelText="Alterar senha"
              id="senha"
              type="password"
              customCol=" w-full"
              errors={errors}
              validate={{ required: true }}
              control={control}
            />

            <div className=" mt-4 ">
              <ButtonHeron
                text="Alterar senha"
                type="second"
                icon="pi pi-sync"
                size="icon"
                onClick={handleSubmit(handleResetSenha)}
              />
            </div>
          </div>
        </div>
      </Card>

      {hasPermition('DASHBOARD') ? <Dashboard /> : null}
    </>
  );
}
