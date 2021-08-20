#region License

/*
Application.NetCryptor
Copyright (c) 2013 James F. Bellinger <http://www.zer7.com/software/cryptsharp>

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted, provided that the above
copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
*/

#endregion License

using System.Collections.Generic;

namespace Application.NetCryptor
{
    partial class Crypter
    {
        static Crypter()
        {
            Blowfish = new BlowfishCrypter();
            TraditionalDes = new TraditionalDesCrypter();
            ExtendedDes = new ExtendedDesCrypter();

            IList<Crypter> crypters = CrypterEnvironment.Default.Crypters;
            crypters.Add(Crypter.Blowfish);
            crypters.Add(Crypter.ExtendedDes);
            crypters.Add(Crypter.TraditionalDes);
        }

        /// <summary>
        /// Blowfish crypt, sometimes called BCrypt. A very good choice.
        /// </summary>
        public static BlowfishCrypter Blowfish
        {
            get;
            private set;
        }

        /// <summary>
        /// Traditional DES crypt.
        /// </summary>
        public static TraditionalDesCrypter TraditionalDes
        {
            get;
            private set;
        }

        /// <summary>
        /// Extended DES crypt.
        /// </summary>
        public static ExtendedDesCrypter ExtendedDes
        {
            get;
            private set;
        }
    }
}