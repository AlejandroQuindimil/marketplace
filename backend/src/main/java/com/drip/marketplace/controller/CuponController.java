package com.drip.marketplace.controller;

import com.drip.marketplace.model.Usuario;
import com.drip.marketplace.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.security.SecureRandom;
import java.util.Map;

// Gestion del cupon de descuento del 10% que se gana en un mini juego en la pagina 404
// Se puede generar y canjear una sola vez por usuario , sin caducidad pero valido por solo un uso.

@RestController
@RequestMapping("/api/cupon")
@RequiredArgsConstructor
public class CuponController {

    private final UsuarioRepository usuarioRepository;
    private final SecureRandom rando =new SecureRandom();

    //Genera un cupon de descuesto del 10% si el usuario aun no tiene uno. Si el usuario
    //ya tiene uno (usado o no) no se genera uno nuevo si no que se devuelve el mismo en 
    //vez de generar uno nuevo cada vez. Para evitar el farmeo de cupones.
    @PostMapping("/generarCupon")
    public ResponseEntity<?> generarCupon(Authentication authentication){
        Usuario usuario = usuarioRepository.findById(authentication.getName())
            .orElseThrow(() -> new IllegalArgumentException("User not found"));
        if (usuario.getCuponCodigo() == null){
            usuario.setCuponCodigo(generarCodigo());
            usuarioRepository.save(usuario);
        }
        return ResponseEntity.ok(Map.of("codigo", usuario.getCuponCodigo(), 
        "utilizado", usuario.isCuponUtilizado()));
    }

    //Comprobar si el cupon del usuario ha sido creado o utilizado, si no generar uno nuevo
    @GetMapping("/mi-cupon")
     public ResponseEntity<?> miCupon(Authentication authentication){
        Usuario usuario = usuarioRepository.findById(authentication.getName())
            .orElseThrow(() -> new IllegalArgumentException("User not found"));
        if (usuario.getCuponCodigo() == null){
            return ResponseEntity.ok(Map.of("cuponActivo", false));
        }
        return ResponseEntity.ok(Map.of("cuponActivo", true, "codigo", usuario.getCuponCodigo(),
        "utilizado", usuario.isCuponUtilizado()));
    }

    // Codigo autogenerado de  8 caracteres alfanumericos + el nombre de la tienda para que sea
    // unico y no se pueda adininar. Los caracteres son falnumericos letras mayusculas y minusculas
    // y numeros. Se añaden al final del nombre de la tienda.
    private String generarCodigo(){
        String caracteres = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        StringBuilder prefijoCodigo = new StringBuilder("DRIP-");
        for (int i =0; i<8; i++){
            prefijoCodigo.append(caracteres.charAt(rando.nextInt(caracteres.length())));
        }
        return prefijoCodigo.toString();
    }

    //Validar el codigo introducido en el carrito. Si es valido y no ha sido utilizado se marca
    //como utilizado y devuelve el descuento del 10%. 
    // El descuento se calcula en el frontend sobre el total del carrito, este emdpoint solo 
    //confirma la validez y si se utiliza el cuponde un solo uso.
    @PostMapping("/validarCupon")
    public ResponseEntity<?>aplicar(
        @RequestBody Map<String, String>body,Authentication authentication){
            Usuario usuario = usuarioRepository.findById(authentication.getName())
            .orElseThrow(() -> new IllegalArgumentException("User not found"));

            String codigoIntroducido =body.get("codigo");
            if (usuario.getCuponCodigo() == null || !usuario.getCuponCodigo().equals(codigoIntroducido)){
                return ResponseEntity.badRequest().body(Map.of("valido",false, "error", "Codigo no valido"));
            }
            if(usuario.isCuponUtilizado()){
                return ResponseEntity.badRequest().body(Map.of("valido",false, "error", "Este codigo ya ha sido utilizado"));
            }
            //Si el cupon es valido y no ha sido utilizado
            return ResponseEntity.ok(Map.of("valido",true, "descuento", 10));
        }
}