import { Entity, BaseEntity, PrimaryGeneratedColumn, Column, DeleteDateColumn, OneToMany, JoinColumn, BeforeInsert, BeforeUpdate } from "typeorm"
import userUtil from "../utils/userUtil"
import Contact from "./Contact"
import ContactInvitation from "./ContactInvitation"

@Entity("user")
export default class User extends BaseEntity {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column()
    name: string;

    @Column()
    username: string;

    @Column()
    email: string;

    @Column()
    password: string;

    @Column()
    picture: string;

    @Column()
    reset_token: string;

    @Column()
    expire_token: Date;

    @Column()
    created_at: Date;

    @Column()
    updated_at: Date;

    @DeleteDateColumn()
    deleted_at: Date;

    @OneToMany(_ => Contact, contact => contact.user)
    @JoinColumn({ name: "user_id" })
    contacts: Contact[];
    
    @OneToMany(_ => Contact, contact => contact.contact)
    @JoinColumn({ name: "contact_user_id" })
    self_contacts: Contact[];

    @OneToMany(_ => ContactInvitation, c_invitation => c_invitation.user)
    @JoinColumn({ name: "receiver_id" })
    contact_invitations: ContactInvitation[];

    @OneToMany(_ => ContactInvitation, c_invitation => c_invitation.sender)
    invitations_sent: ContactInvitation[];

    @BeforeInsert()
    private beforeInsert() {
        const date = new Date()
        this.created_at = date 
        this.updated_at = date

        this.password = userUtil.encryptPassword(this.password)
    };

    @BeforeUpdate()
    private beforeUpdate() {
        this.updated_at = new Date()
    }
}