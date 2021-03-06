import {
    Entity,
    BaseEntity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    BeforeInsert,
} from 'typeorm';
import User from './User';

@Entity('contact_invitation')
export default class ContactInvitation extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column('uuid')
    sender_id: string;

    @Column('uuid')
    receiver_id: string;

    @Column({ default: true })
    pending: Boolean;

    @Column()
    created_at: Date;

    @ManyToOne(_ => User, user => user.contact_invitations, {
        cascade: ['update', 'remove'],
    })
    @JoinColumn({ name: 'receiver_id' })
    user: User;

    @ManyToOne(_ => User, user => user.invitations_sent, {
        cascade: ['update', 'remove'],
    })
    @JoinColumn({ name: 'sender_id' })
    sender: User;

    @BeforeInsert()
    private beforeInsert() {
        this.created_at = new Date();
    }
}
