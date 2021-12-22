import { Entity, BaseEntity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from "typeorm"
import { ContactMessage } from "."

@Entity("contact_media_message")
export default class ContactMediaMessage extends BaseEntity {
    @PrimaryGeneratedColumn("uuid")
    id: string

    @Column()
    message_id: string

    @Column()
    url: string

    @Column()
    type: string

    @ManyToOne(_ => ContactMessage, cMessage => cMessage.medias)
    @JoinColumn({ name: "message_id" })
    message: ContactMessage    
}
