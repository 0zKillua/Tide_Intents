module tide::tide {
    use std::string::{Self, String};
    use sui::package;
    use sui::event;

    // === Structs ===
    
    public struct TIDE has drop {}

    public struct ProtocolInfo has key, store {
        id: UID,
        version: u64,
        name: String
    }

    public struct ProtocolInitialized has copy, drop {
        id: ID,
        version: u64
    }

    // === Init ===

    fun init(otw: TIDE, ctx: &mut TxContext) {
        // Claim Publisher
        let publisher = package::claim(otw, ctx);
        transfer::public_transfer(publisher, tx_context::sender(ctx));

        // Create Protocol Info
        let id = object::new(ctx);
        let info = ProtocolInfo {
            id,
            version: 1,
            name: string::utf8(b"Tide Protocol")
        };
        
        event::emit(ProtocolInitialized {
            id: object::uid_to_inner(&info.id),
            version: 1
        });

        transfer::share_object(info);
    }
}
