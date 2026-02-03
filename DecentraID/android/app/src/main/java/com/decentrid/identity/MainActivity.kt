package com.decentrid.identity

import android.os.Bundle
import android.widget.Button
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.biometric.BiometricPrompt
import androidx.core.content.ContextCompat
import java.util.concurrent.Executor

/**
 * MainActivity for DecentraID Android App
 * Handles Identity display and Biometric authentication for sharing.
 */
class MainActivity : AppCompatActivity() {

    private lateinit var executor: Executor
    private lateinit var biometricPrompt: BiometricPrompt
    private lateinit var promptInfo: BiometricPrompt.PromptInfo

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        val btnVerify = findViewById<Button>(R.id.btnVerify)
        val tvDidStatus = findViewById<TextView>(R.id.tvDidStatus)
        val tvDidValue = findViewById<TextView>(R.id.tvDidValue)

        executor = ContextCompat.getMainExecutor(this)
        
        // Initialize Biometric Prompt
        biometricPrompt = BiometricPrompt(this, executor,
            object : BiometricPrompt.AuthenticationCallback() {
                override fun onAuthenticationError(errorCode: Int, errString: CharSequence) {
                    super.onAuthenticationError(errorCode, errString)
                    Toast.makeText(applicationContext, "Auth Error: $errString", Toast.LENGTH_SHORT).show()
                }

                override fun onAuthenticationSucceeded(result: BiometricPrompt.AuthenticationResult) {
                    super.onAuthenticationSucceeded(result)
                    Toast.makeText(applicationContext, "Identity Verified & Shared!", Toast.LENGTH_LONG).show()
                    // Logic to share DID via QR or NFC
                }

                override fun onAuthenticationFailed() {
                    super.onAuthenticationFailed()
                    Toast.makeText(applicationContext, "Auth Failed", Toast.LENGTH_SHORT).show()
                }
            })

        promptInfo = BiometricPrompt.PromptInfo.Builder()
            .setTitle("Verify Identity")
            .setSubtitle("Authenticate using your biometrics")
            .setNegativeButtonText("Cancel")
            .build()

        btnVerify.setOnClickListener {
            biometricPrompt.authenticate(promptInfo)
        }

        // Mock loading of ID from Blockchain/Local Encrypted Storage
        loadIdentity()
    }

    private fun loadIdentity() {
        // In a real implementation, we would use Web3j or WalletConnect
        // to query the smart contract state.
        val mockDid = "did:decentrid:0x71c7656ec7ab88b098defb751b7401b5f6d8976f"
        findViewById<TextView>(R.id.tvDidValue).text = mockDid
        findViewById<TextView>(R.id.tvDidStatus).text = "Verified Active"
    }
}
