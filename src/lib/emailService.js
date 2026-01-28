// Servico de Email usando EmailJS
// Configuracao: https://www.emailjs.com

const EMAILJS_SERVICE_ID = 'service_6pculfm';
const EMAILJS_PUBLIC_KEY = 'BheGSXFZ0J0McwvzU';
const EMAILJS_TEMPLATE_REGISTRO = 'template_registro'; // Alterar para o ID do template criado

// Carregar SDK do EmailJS
const loadEmailJS = () => {
  return new Promise((resolve, reject) => {
    if (window.emailjs) {
      resolve(window.emailjs);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@emailjs/browser@3/dist/email.min.js';
    script.onload = () => {
      window.emailjs.init(EMAILJS_PUBLIC_KEY);
      resolve(window.emailjs);
    };
    script.onerror = reject;
    document.head.appendChild(script);
  });
};

// Enviar notificacao de novo cadastro
export const notificarNovoCadastro = async (nome, email) => {
  try {
    const emailjs = await loadEmailJS();

    const templateParams = {
      user_name: nome,
      user_email: email,
      date: new Date().toLocaleString('pt-BR', {
        dateStyle: 'full',
        timeStyle: 'short'
      })
    };

    const response = await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_REGISTRO,
      templateParams
    );

    console.log('Email enviado:', response.status);
    return { success: true };
  } catch (error) {
    console.error('Erro ao enviar email:', error);
    return { success: false, error };
  }
};

// Enviar notificacao de contato
export const notificarNovoContato = async (nome, email, assunto, mensagem) => {
  try {
    const emailjs = await loadEmailJS();

    const templateParams = {
      user_name: nome,
      user_email: email,
      subject: assunto || 'Sem assunto',
      message: mensagem,
      date: new Date().toLocaleString('pt-BR', {
        dateStyle: 'full',
        timeStyle: 'short'
      })
    };

    const response = await emailjs.send(
      EMAILJS_SERVICE_ID,
      'template_contato', // Criar template separado para contatos
      templateParams
    );

    console.log('Email de contato enviado:', response.status);
    return { success: true };
  } catch (error) {
    console.error('Erro ao enviar email de contato:', error);
    return { success: false, error };
  }
};

export default {
  notificarNovoCadastro,
  notificarNovoContato
};
