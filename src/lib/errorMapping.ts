export function getFriendlyErrorMessage(error: any): string {
  if (!error) return 'Ocorreu um erro inesperado. Tente novamente.';

  const errorCode = error.code || error.message;

  if (typeof errorCode !== 'string') {
    return 'Ocorreu um erro inesperado. Tente novamente.';
  }

  switch (errorCode) {
    case 'auth/email-already-in-use':
      return 'Este e-mail já está cadastrado. Tente fazer login em vez de criar uma nova conta.';
    case 'auth/invalid-email':
      return 'O endereço de e-mail fornecido é inválido.';
    case 'auth/weak-password':
      return 'A senha é muito fraca. Use pelo menos 6 caracteres.';
    case 'auth/user-not-found':
      return 'Usuário não encontrado. Verifique o e-mail ou cadastre-se.';
    case 'auth/wrong-password':
      return 'Senha incorreta. Tente novamente.';
    case 'auth/invalid-credential':
      return 'E-mail ou senha incorretos. Verifique seus dados e tente novamente.';
    case 'auth/too-many-requests':
      return 'Muitas tentativas de login falhas. Por segurança, tente novamente mais tarde.';
    case 'auth/network-request-failed':
      return 'Erro de conexão. Verifique sua internet e tente novamente.';
    case 'auth/popup-closed-by-user':
      return 'O login com o Google foi cancelado.';
    case 'auth/operation-not-allowed':
      return 'Este método de login não está habilitado no momento.';
    case 'auth/unauthorized-domain':
      return 'Este domínio não está autorizado no Firebase. Adicione o domínio atual na aba "Domínios autorizados" do Authentication.';
    case 'auth/requires-recent-login':
      return 'Por segurança, você precisa fazer login novamente para realizar esta ação.';
    default:
      // Fallback for unknown errors
      console.error('Unhandled Firebase error:', error);
      return 'Ocorreu um erro inesperado. Tente novamente mais tarde.';
  }
}
