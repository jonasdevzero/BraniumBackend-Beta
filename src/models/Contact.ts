import { Entity, BaseEntity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany, BeforeInsert } from "typeorm"
import ContactMessage from "./ContactMessage";
import User from "./User"

@Entity("contact")
export default class Contact extends BaseEntity {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column("uuid")
    user_id: string;

    @Column("uuid")
    contact_user_id: string;

    @Column()
    unread_messages: number;

    @Column()
    last_message_time: Date;

    @Column()
    blocked: boolean;

    @Column()
    you_blocked: boolean;

    @ManyToOne(_ => User, user => user.contacts, { cascade: ["update"] })
    @JoinColumn({ name: "user_id" })
    user: User;

    @ManyToOne(_ => User, user => user.self_contacts, { cascade: ["update"] })
    @JoinColumn({ name: "contact_user_id" })
    contact: User;

    @OneToMany(_ => ContactMessage, c_message => c_message.contact)
    @JoinColumn({ name: "contact_id" })
    messages: ContactMessage[];

    @BeforeInsert()
    private beforeInsert() {
        this.last_message_time = new Date()
        this.unread_messages = 0
        this.blocked = false
        this.you_blocked = false
    }
}