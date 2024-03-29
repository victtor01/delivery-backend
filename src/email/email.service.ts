import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { SendEmailDto } from './dto/send-email.dto';

@Injectable()
export class EmailService {
  private transporter: any;

  constructor() {
    this.transporter = nodemailer.createTransport({
      service: 'gmail', // Você pode configurar para o provedor de e-mail que desejar
      auth: {
        user: "josevictot.ar@gmail.com",
        pass: "tmxpeqzeaqbsuswx",
      },
    });
  }

  async sendEmail({ to, subject, text, html }: SendEmailDto) {
    const mailOptions = {
      from: 'josevictot.ar@gmail.com',
      to,
      subject,
      text,
      html
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('Email enviado:', info.response);
      return true;
    } catch (error) {
      console.error('Erro ao enviar e-mail:', error);
      return false;
    }
  }
}
