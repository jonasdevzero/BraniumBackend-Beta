import { Entity, BaseEntity, PrimaryGeneratedColumn, Column, DeleteDateColumn, ManyToOne, JoinColumn } from "typeorm"
import Contact from "./Contact";

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

    @Column("uuid")
    reference_message_id: string;

    @Column()
    created_at: Date;

    @DeleteDateColumn()
    deleted_at: Date;

    @ManyToOne(_ => Contact, contact => contact.message)
    @JoinColumn({ name: "contact_id" })
    contact: Contact;
}
