use rand::{distributions::Distribution, thread_rng, Rng};

pub fn generate_name() -> String {
    let rng = thread_rng();
    let name = rng.sample_iter(Filename).take(7).collect();
    String::from_utf8(name).expect("This will always succeed since `Filename` only emits ASCII characters which are valid UTF-8.")
}

struct Filename;

impl Distribution<u8> for Filename {
    fn sample<R: Rng + ?Sized>(&self, rng: &mut R) -> u8 {
        const GEN_ASCII_STR_CHARSET: &[u8] = b"ABCDEFGHIJKLMNOPQRSTUVWXYZ\
                abcdefghijklmnopqrstuvwxyz\
                0123456789-_";

        // (0..2^6)
        let var = rng.next_u32() >> (32 - 6);
        GEN_ASCII_STR_CHARSET[var as usize]
    }
}
