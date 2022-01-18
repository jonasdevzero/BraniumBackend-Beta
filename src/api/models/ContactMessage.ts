import {
    Entity,
    BaseEntity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    OneToMany,
} from 'typeorm';
import { ContactMediaMessage } from '.';
import Contact from './Contact';

@Entity('contact_message')
export default class ContactMessage extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid', unsigned: true })
    contact_id: string;

    @Column({ nullable: true, unsigned: true })
    text: string;

    @Column({ type: 'uuid', unsigned: true })
    sender_id: string;

    @Column({ type: 'uuid', unsigned: true })
    bidirectional_id: string;

    @Column()
    viewed: Boolean;

    @Column({ nullable: true })
    viewed_at: Date;

    @Column({ unsigned: true })
    created_at: Date;

    @ManyToOne(_ => Contact, contact => contact.messages, {
        cascade: ['update', 'remove'],
    })
    @JoinColumn({ name: 'contact_id' })
    contact: Contact;

    @OneToMany(_ => ContactMediaMessage, cMediaMessage => cMediaMessage.message)
    @JoinColumn({ name: 'message_id' })
    medias: ContactMediaMessage[];
}
