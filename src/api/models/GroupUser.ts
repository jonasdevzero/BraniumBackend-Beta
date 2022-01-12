import { group } from 'console';
import {
    Entity,
    BaseEntity,
    PrimaryGeneratedColumn,
    Column,
    JoinColumn,
    ManyToOne,
} from 'typeorm';
import { Group, User } from '.';

@Entity('group_user')
export default class GroupUser extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid', unsigned: true })
    group_id: string;

    @Column({ type: 'uuid', unsigned: true })
    user_id: string;

    @Column({ nullable: true })
    unread_messages: number;

    @Column()
    role: number;

    @Column()
    role_since: Date;

    @ManyToOne(_ => Group, group => group.users, {
        cascade: ['update', 'remove']
    })
    @JoinColumn({ name: 'group_id' })
    group: Group;

    @ManyToOne(_ => User, user => user.groups, {
        cascade: ['update', 'remove']
    })
    @JoinColumn({ name: 'group_id' })
    user: User;
}
