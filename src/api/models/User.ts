import {
    Entity,
    BaseEntity,
    PrimaryGeneratedColumn,
    Column,
    DeleteDateColumn,
    OneToMany,
    JoinColumn,
    BeforeInsert,
    BeforeUpdate,
} from 'typeorm';
import { Group, GroupMessage, GroupMessageView, GroupUser } from '.';
import userUtil from '../helpers/crypt';
import Contact from './Contact';
import ContactInvitation from './ContactInvitation';

@Entity('user')
export default class User extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @Column({ unique: true })
    username: string;

    @Column({ unique: true })
    email: string;

    @Column()
    password: string;

    @Column({ nullable: true, default: null })
    picture: string;

    @Column({ nullable: true, default: null, unique: true })
    reset_token: string;

    @Column({ nullable: true, default: null })
    expire_token: Date;

    @Column()
    created_at: Date;

    @Column()
    updated_at: Date;

    @DeleteDateColumn({ nullable: true, default: null })
    deleted_at: Date;

    @OneToMany(_ => Contact, contact => contact.user)
    @JoinColumn({ name: 'user_id' })
    contacts: Contact[];

    @OneToMany(_ => GroupUser, group_u => group_u.user)
    @JoinColumn({ name: 'user_id' })
    groups: GroupUser[];

    @BeforeInsert()
    private beforeInsert() {
        const date = new Date();
        this.created_at = date;
        this.updated_at = date;

        this.password = userUtil.encryptPassword(this.password);
    }

    @BeforeUpdate()
    private beforeUpdate() {
        this.updated_at = new Date();
    }

    /* --------- Aditional Data ----------- */

    @OneToMany(_ => Contact, contact => contact.contact)
    @JoinColumn({ name: 'contact_user_id' })
    self_contacts: Contact[];

    @OneToMany(_ => ContactInvitation, c_invitation => c_invitation.user)
    @JoinColumn({ name: 'receiver_id' })
    contact_invitations: ContactInvitation[];

    @OneToMany(_ => ContactInvitation, c_invitation => c_invitation.sender)
    invitations_sent: ContactInvitation[];

    @OneToMany(_ => Group, group => group.creator)
    @JoinColumn({ name: 'created_by' })
    created_groups: Group[];

    @OneToMany(_ => Group, group => group.leader)
    @JoinColumn({ name: 'leader_id' })
    groups_as_leader: Group[];

    @OneToMany(_ => GroupMessage, message => message.sender)
    @JoinColumn({ name: 'sender_id' })
    group_messages_sent: GroupMessage[];

    @OneToMany(_ => GroupMessageView, view => view.viewer)
    @JoinColumn({ name: 'viewer_id' })
    group_messages_viewed: GroupMessageView[]
}
