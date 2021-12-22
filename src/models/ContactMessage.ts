import { Entity, BaseEntity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany } from "typeorm"
import { ContactMediaMessage } from ".";
import Contact from "./Contact"

@Entity("contact_message")
export default class ContactMessage extends BaseEntity {
    @PrimaryGeneratedColumn("uuid")
    id: string;   
    
    @Column("uuid")
    contact_id: string;
    
    @Column()
    text: string;

    @Column("uuid")
    sender_id: string;

    @Column("uuid")
    bidirectional_id: string;

    @Column()
    viewed: Boolean;

    @Column()
    created_at: Date;

    @ManyToOne(_ => Contact, contact => contact.messages)
    @JoinColumn({ name: "contact_id" })
    contact: Contact;

    @OneToMany(_ => ContactMediaMessage, cMediaMessage => cMediaMessage.message)
    @JoinColumn({ name: "message_id" })
    medias: ContactMediaMessage[]
}
