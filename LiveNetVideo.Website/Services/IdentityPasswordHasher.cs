using Application.NetCryptor;
using LiveNetVideo.Website.Models;
using Microsoft.AspNetCore.Identity;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace LiveNetVideo.Website.Services
{
    public class IdentityPasswordHasher : PasswordHasher<ApplicationUser>
    {
        public override PasswordVerificationResult VerifyHashedPassword(ApplicationUser user, string hashedPassword, string providedPassword)
        {
            //NOTE: requires password checker, that works with php CheckPassword

            bool matches = Crypter.CheckPassword(providedPassword, hashedPassword);

            //return hashedPassword.Equals(HashPassword(providedPassword)) ? PasswordVerificationResult.Success : PasswordVerificationResult.Failed;

            //bool matches = true;
            return (matches == true) ? PasswordVerificationResult.Success : PasswordVerificationResult.Failed;
        }

        public override string HashPassword(ApplicationUser user, string password)
        {
            // NOTE: requires password hasher that will work with php CheckPassword
            return Crypter.Blowfish.Crypt(password, new CrypterOptions() { { CrypterOption.Variant, BlowfishCrypterVariant.Corrected }, { CrypterOption.Rounds, 10 } });

            //return password;
        }
    }
}