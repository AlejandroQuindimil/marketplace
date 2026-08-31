package com.drip.marketplace.service;

import lombok.RequiredArgsConstructor;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import jakarta.mail.internet.MimeMessage;

// se encarga solo de mandar correos, no sabe nada de usuarios ni de
// logica de negocio: asi si mañana cambiamos de proveedor de email,
// solo tocamos esta clase
@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    public void enviarCodigoVerificacion(String destinatario, String codigo) {
        try {
            MimeMessage mensaje = mailSender.createMimeMessage();
            // true = permite adjuntos/HTML, "UTF-8" para que las tildes no se rompan
            MimeMessageHelper helper = new MimeMessageHelper(mensaje, true, "UTF-8");

            // SE AÑADE EL REMITENTE CON EL DOMINIO DEMO DE MAILTRAP
            helper.setFrom("drip.notificaciones@gmail.com");
            helper.setTo(destinatario);
            helper.setSubject("Verifica tu cuenta en DRIP");
            helper.setText(construirHtml(codigo), true);

            mailSender.send(mensaje);
        } catch (Exception e) {
            // no relanzamos la excepcion como algo que rompa el registro:
            // el usuario ya se creo en la BD, si el email falla puede
            // pedir que se lo reenviemos mas tarde
            e.printStackTrace();
            System.err.println("No se pudo enviar el email de verificacion: " + e.getMessage());
        }
    } 

    // plantilla simple en HTML, nada de frameworks de email complejos
    // para no meter mas dependencias de las necesarias en este proyecto
    private String construirHtml(String codigo) {
        return """
                <div style="font-family: -apple-system, sans-serif; max-width: 480px; margin: 0 auto;">
                    <h1 style="letter-spacing: 1px;">DRIP</h1>
                    <p>Gracias por registrarte. Usa este código para verificar tu cuenta:</p>
                    <div style="background: #f5f5f7; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
                        <span style="font-size: 32px; font-weight: 700; letter-spacing: 6px;">%s</span>
                    </div>
                    <p style="color: #666; font-size: 13px;">Este código caduca en 24 horas. Si no has sido tú, ignora este correo.</p>
                </div>
                """.formatted(codigo);
    } 

} 